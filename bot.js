const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
require("dotenv").config();
const axios = require("axios");

//Here is the API token logins you need to change to run this program. Create your own
// Discord bot and replace the credentials with your own credentials and it should work

client.login(process.env.DISCORD_LOGIN_TOKEN);
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

    console.log(msgSplit);
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
                  console.log(res.data);
                  if (res.error) {
                    console.log(res.error);
                  } else {
                    function checkStatus() {
                      let id = res.data.id;
                      axios
                        .get(
                          `https://api.assemblyai.com/v2/transcript/${id}`,
                          config
                        )
                        .then((res) => {
                          var status_of_transcipt = res.data.status;

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

                          // once the transcript has thrown an error

                          if (status_of_transcipt === "error") {
                            return msg.reply(
                              `Your audio file gave an error of: ${res.error} `
                            );
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

                            // Checking if the Content-Safety Detection value is True or false and responding accordingly

                            if ((res.data.content_safety = true)) {
                              let test =
                                res.data.content_safety_labels.results[0];
                              var contentSafetyString = "";

                              // If the content safety detection found no results

                              if (test == undefined) {
                                msg.reply(
                                  "No content-safety results to report."
                                );
                              }

                              // If the content safety detection feature did find some results
                              else {
                                for (let i = 0; i < test.labels.length; i++) {
                                  console.log("test", test.labels[i].label);
                                  contentSafetyString +=
                                    test.labels[i].label + ", ";
                                }
                                var finalStr = contentSafetyString.slice(0, -2);

                                msg.reply(
                                  `Your content-safety results of the audio file are: ${finalStr}`
                                );
                              }
                            }
                          }

                          console.log(res.data.status);
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
