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

let config = {
  headers: {
    authorization: token,
    "Content-Type": "application/json",
  },
};
let audio = {};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  if (msg.content === "!!tt help") {
    msg.reply("``````");
  }
  if (msg.content.includes("!!tt")) {
    var msgSplit = msg.content.split(" ");

    if (msg.content.includes("CS")) {
      audio["content_safety"] = true;
    }
    if (msg.content.includes("T")) {
      audio["iab_categories"] = true;
    }
    if (msg.content.includes("KP")) {
      audio["auto_highlights"] = true;
    }

    for (let i = 0; i < msgSplit.length; i++) {
      if (msgSplit[i].includes(":\\")) {
        let file = msgSplit[i];

        fs.readFile(file, (err, data) => {
          if (err) return console.log(err);

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
                  if (res.error) {
                    console.log(res.error);
                  } else {
                    // recursive function to continually check for transcript status

                    function checkStatus() {
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
                              `Your audio file gave an error of: ${res.error} `
                            );
                          }

                          //checking if the transcript is still processing and notifying discord

                          if (
                            status_of_transcipt === "queued" ||
                            status_of_transcipt === "processing"
                          ) {
                            msg.reply(
                              `Your audio file is ${status_of_transcipt}`
                            );
                            setTimeout(() => {
                              checkStatus();
                            }, 5000);
                          }

                          // if the transcription process has been completed

                          if (status_of_transcipt === "completed") {
                            msg.reply(
                              `Your audio file is ${status_of_transcipt}`
                            );

                            // Responding to discord the transcription text of the audio file

                            msg.reply(
                              "```Your final transcription is printed below: \n\n" +
                                `${res.data.text}` +
                                "```"
                            );

                            // Checking if the Content-Safety Detection value is True and responding accordingly

                            if (res.data.content_safety == true) {
                              let test =
                                res.data.content_safety_labels.results[0];
                              var contentSafetyString = "";

                              // If the content safety detection found no results

                              if (test == undefined) {
                                msg.reply(
                                  "```CS: No content-safety results to report.```"
                                );
                                audio["content_safety"] = false;
                              }

                              // If the content safety detection feature did find some results
                              else {
                                for (let i = 0; i < test.labels.length; i++) {
                                  contentSafetyString +=
                                    test.labels[i].label + ", ";
                                }
                                var finalStr = contentSafetyString.slice(0, -2);

                                // setting the content_safety feature back to false for future requests

                                audio["content_safety"] = false;

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
                                audio["iab_categories"] = false;
                              }

                              // If the API sent back a summary
                              /*If the value or "weight" of the summary entry is above 80%, we return it to discord*/
                              else
                                for (const [key, value] of Object.entries(
                                  topicSummary
                                )) {
                                  if (value > 0.8) {
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
                              audio["iab_categories"] = false;
                            }

                            // Checking if auto_highlights is true

                            if (res.data.auto_highlights == true) {
                              var textResponse = "";
                              var kpResponse =
                                res.data.auto_highlights_result.results;

                              // Response if Auto_highlights is undefined or returns an emtpy object.

                              if (kpResponse == undefined) {
                                msg.reply("```KP: No key phrases to report```");
                                audio["auto_highlights"] = false;
                              }

                              // If the API returns an auto_highlight response. We loop through and message back to discord
                              // the Key Phrases that are ranked above or equal to 7%

                              for (var i = 0; i < kpResponse.length; i++) {
                                let rank = kpResponse[i].rank;
                                if (rank >= 0.07) {
                                  textResponse += kpResponse[i].text + ", ";
                                }
                              }
                              msg.reply(
                                `\`\`\`KP: Key Phrases found in the audio file listed below: \n\n${textResponse.slice(
                                  0,
                                  -2
                                )}\`\`\``
                              );

                              audio["auto_highlights"] = false;
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

// error handling response
// add transcription detail additions for CS T KP
// respond with further information about transcription details

// // client.on("message", async (msg) => {
// //   if (!msg.member.voice.channel) {
// //     console.log("Not in a voice channel!");
// //   }
// //   if (msg.content === "!!tt cs" ) {
// //     const connection = await msg.member.voice.channel.join();

// //     const audio = connection.receiver.createStream(msg, {
// //       mode: "pcm",
// //       end: "manual",
// //     });

// //     audio.pipe(fs.createWriteStream(`${msg.member.user.username}_audio`));
// //   }
// // });
