const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
require("dotenv").config();
const axios = require("axios");
const YTPlayer = require("yt-player");
const player = new YTPlayer(".youtube-player", {
  host: "www.youtube.com",
});
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var token = process.env.ASSEMBLY_API_TOKEN;
let config = {
  headers: {
    authorization: token,
    "Content-Type": "text/html",
  },
};
const document = dom.window.document;
const dom = new JSDOM(``, {
  url: "https://www.youtube.com/watch?v=hS5CfP8n_js",
  contentType: "text/html",
  includeNodeLocations: true,
  storageQuota: 10000000,
  includeNodeLocations: true,
  playVideo: () => {
    player.load("hS5CfP8n_js");
    player.setVolume(100);
  },
});

player.on("playing", () => {
  console.log(player.getDuration()); // => 351.521
});

console.log(document);

// client.login(process.env.DISCORD_LOGIN_TOKEN);

// client.on("ready", () => {
//   console.log(`Logged in as ${client.user.tag}!`);
// });

// client.on("message", async (msg) => {
//   if (msg.content === "!!tt help") {
//     msg.reply(
//       "```For local file include 'LF' in your command.  Example: !!tt LF \nFor public links, no additional command required.\n\nAdditional transcription requests:\nContent-Safety: CS\nTopic: T\nKey Phrases: KP\n\nCommand Structure: !!tt <LF(optional if its a local file)> <Additional transcription requests CS,T,KP (optional)> <Link to public URL audio or video file or local file path if local file>\n\nExample Commands:\nLocal File Transcribe: !!tt LF C:/file path\nPublic URL transcribe: !!tt https://Linktofile.com\nLocal file with additional requests: !!tt LF CS C:/pathtofile\nPublic URL with additional requests: !!tt CS T https://link```"
//     );
//   }
//   if (msg.content.includes("!!tt")) {
//     var msgSplit = msg.content.split(" ");
//     console.log(msgSplit);
//     for (let i = 0; i < msgSplit.length; i++) {
//       if (msgSplit[i].includes("https://")) {
//         let audio = {
//           audio_url: msgSplit[i],
//         };
//         console.log(audio);
//         axios
//           .post("https://api.assemblyai.com/v2/transcript", audio, config)
//           .then((res) => {
//             console.log(res.data);
//             if (res.error) {
//               console.log(res.error);
//             } else {
//               function checkStatus() {
//                 let id = res.data.id;
//                 axios
//                   .get(`https://api.assemblyai.com/v2/transcript/${id}`, config)
//                   .then((res) => {
//                     var status_of_transcipt = res.data.status;
//                     console.log(status_of_transcipt);
//                     if (
//                       status_of_transcipt === "queued" ||
//                       status_of_transcipt === "processing"
//                     ) {
//                       setTimeout(() => {
//                         checkStatus();
//                       }, 3000);
//                     }
//                     if (
//                       status_of_transcipt === "error" ||
//                       status_of_transcipt === "completed"
//                     ) {
//                       return console.log("broke function", res.data);
//                     }
//                     console.log(res.data.status);
//                   });
//               }
//               checkStatus();
//             }
//             console.log(res.data.id, res.data.status);
//           });
//       }
//     }
//   }
// });

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
