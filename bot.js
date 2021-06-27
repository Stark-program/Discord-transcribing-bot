const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
require("dotenv").config();
const axios = require("axios");

/*
Create your own Discord bot and replace the credentials with your own credentials.
You will also need to give your discord bot the correct permissions. 
Permissions to check:
"View channels"
"Send Messages"

You will also need to get an API token from https://app.assemblyai.com/login/
*/

/*Change this login token for Discord*/
client.login(process.env.DISCORD_LOGIN_TOKEN);
/*Change this token variable here for Assembly AI*/
var token = process.env.ASSEMBLY_API_TOKEN;

const AUTO_HIGHLIGHT_RANK_THRESHOLD = 0.07;
const TOPIC_RANK_THRESHOLD = 0.8;

const config = {
  headers: {
    authorization: token,
    "Content-Type": "application/json",
  },
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  if (msg.content === "!!tt help") {
    msg.reply(
      "```Add these commands for additional transcription details:\n\n-CS: Content-Safety-flag profanity, hate speech, and other sensitive content in an audio/video file\n-T: Topic Detection to detect the topics in an audio/video file, based on the transcription\n-KP: Key-Phrases that will surface key words/phrases in the transcription text\n\nExample:\n\n!!tt -CS C:/path/to/file (This will use the content safety feature on the audio file)\n\nExample #2:\n\n!!tt -CS -KP -T C:/path/to/file (this will use the content-safety, key-phrases, and topic detection features on the transcription)\n\n\nRules to follow when transcribing a file:\n\n1.Have no spaces in your file path\n2.Remove quotation marks from your file path```"
    );
  }
  if (msg.content.includes("!!tt")) {
    let audio = {};
    var msgSplit = msg.content.split(" ");
    var file_split = msgSplit[msgSplit.length - 1].split("\\");
    var file_name = file_split[file_split.length - 1];

    if (msg.content.includes("-CS")) {
      audio["content_safety"] = true;
    }
    if (msg.content.includes("-T")) {
      audio["iab_categories"] = true;
    }
    if (msg.content.includes("-KP")) {
      audio["auto_highlights"] = true;
    }

    for (let i = 0; i < msgSplit.length; i++) {
      if (msgSplit[i].includes(":\\")) {
        let file = msgSplit[i];

        fs.readFile(file, (err, data) => {
          if (err) {
            if (err.errno == -4058) {
              msg.reply(
                "Error -4058: Make sure your file path has no spaces, or quotation marks, otherwise the transcription will not work."
              );
            }
          }

          axios
            .post(`https://api.assemblyai.com/v2/upload`, data, {
              headers: { "transfer-encoding": "chunked", authorization: token },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
            })
            .then(async (res) => {
              const uploadUrl = res.data.upload_url;
              audio["audio_url"] = uploadUrl;

              await axios
                .post("https://api.assemblyai.com/v2/transcript", audio, config)
                .then((res) => {
                  if (res.data.error) {
                    console.log(res.data.error);
                  } else {
                    // recursive function to continually check for transcript status

                    function checkStatus(currentStatus) {
                      let id = res.data.id;
                      axios
                        .get(
                          `https://api.assemblyai.com/v2/transcript/${id}`,
                          config
                        )
                        .then((res) => {
                          var status_of_transcipt = res.data.status;

                          // if the transcript has thrown an error

                          if (status_of_transcipt === "error") {
                            return msg.reply(
                              `\`\`\`Your audio file gave an error of: ${res.data.error}\`\`\``
                            );
                          }

                          //checking if the transcript is still processing and notifying discord

                          if (
                            status_of_transcipt === "queued" ||
                            status_of_transcipt === "processing"
                          ) {
                            if (currentStatus != status_of_transcipt) {
                              msg.reply(
                                `Your audio file is ${status_of_transcipt}`
                              );
                            }

                            setTimeout(() => {
                              checkStatus(status_of_transcipt);
                            }, 5000);
                          }

                          // if the transcription process has been completed

                          if (status_of_transcipt === "completed") {
                            msg.reply(
                              `Your audio file is ${status_of_transcipt}`
                            );
                            let text_response = res.data.text;
                            let textLength = text_response.length;
                            if (textLength >= 2001) {
                              msg.reply(
                                `Your audio file exceeded the discord limit of 4000 characters and therefore was exported as a text file as: ${file_name}.txt`
                              );
                              fs.writeFile(
                                `${file_name}.txt`,
                                text_response,
                                (err) => {
                                  if (err) throw err;
                                }
                              );
                            } else if (textLength <= 2000) {
                              msg.reply(
                                "```Your final transcription is printed below: \n\n" +
                                  `${res.data.text}` +
                                  "```"
                              );
                            }

                            // Responding to discord the transcription text of the audio file

                            // Checking if the Content-Safety Detection value is True and responding accordingly

                            if (res.data.content_safety == true) {
                              let content_safety_response =
                                res.data.content_safety_labels.results[0];
                              var contentSafetyString = "";

                              // If the content safety detection found no results

                              if (content_safety_response == undefined) {
                                msg.reply(
                                  "```CS: No content-safety results to report.```"
                                );
                              }

                              // If the content safety detection feature did find some results
                              else {
                                for (
                                  let i = 0;
                                  i < content_safety_response.labels.length;
                                  i++
                                ) {
                                  contentSafetyString +=
                                    content_safety_response.labels[i].label +
                                    ", ";
                                }
                                var finalStr = contentSafetyString.slice(0, -2);

                                // setting the content_safety feature back to false for future requests

                                // sending the content_safety results back to discord

                                msg.reply(
                                  `\`\`\`CS: Your content-safety results of the audio file are: ${finalStr}\`\`\`\``
                                );
                              }
                            }

                            //Checking if key phrases (iab_categories) is true

                            if (res.data.iab_categories == true) {
                              var topicArr = [];
                              var topicSummary =
                                res.data.iab_categories_result.summary;

                              // If the API sent back an empty summary list.

                              if (topicSummary == undefined) {
                                msg.reply("```T: No topics to report.```");
                              }

                              // If the API sent back a summary
                              /*If the value or "weight" of the summary entry is above 80%, we return it to discord*/
                              else
                                for (const [key, value] of Object.entries(
                                  topicSummary
                                )) {
                                  if (value > TOPIC_RANK_THRESHOLD) {
                                    let topicResponse = "";
                                    topicResponse += key;
                                    let tempSplit = topicResponse.split(">");
                                    topicArr.push(
                                      tempSplit[tempSplit.length - 1]
                                    );
                                  }
                                }

                              // Constructing a correct String variable by adding spaces between words and after commas.

                              const topicResponseFinal = topicArr
                                .join()
                                .replace(/([a-z])([A-Z])/g, "$1 $2")
                                .replace(/,/g, ", ");
                              msg.reply(
                                `\`\`\`T: Your topics in this audio file are: ${topicResponseFinal}\`\`\`\``
                              );
                            }

                            // Checking if auto_highlights is true

                            if (res.data.auto_highlights == true) {
                              var textResponse = "";
                              var kpResponse =
                                res.data.auto_highlights_result.results;

                              // Response if Auto_highlights is undefined or returns an emtpy object.

                              if (kpResponse == undefined) {
                                msg.reply("```KP: No key phrases to report```");
                              }

                              // If the API returns an auto_highlight response. We loop through and message back to discord
                              // the Key Phrases that are ranked above or equal to 7%

                              for (var i = 0; i < kpResponse.length; i++) {
                                let rank = kpResponse[i].rank;
                                if (rank >= AUTO_HIGHLIGHT_RANK_THRESHOLD) {
                                  textResponse += kpResponse[i].text + ", ";
                                }
                              }
                              msg.reply(
                                `\`\`\`KP: Key Phrases found in the audio file listed below: \n\n${textResponse.slice(
                                  0,
                                  -2
                                )}\`\`\``
                              );
                            }
                          }
                        });
                    }

                    checkStatus();
                  }
                });
            })
            .catch((err) => {
              console.log(err);
            });
        });
      }
    }
  }
});
