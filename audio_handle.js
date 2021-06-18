var axios = require("axios");
var path = require("path");
var fs = require("fs");

var url = "https://api.assemblyai.com/v2";
var token = process.env.ASSEMBLY_API_TOKEN;
var file = "Stark_audio.mp3";

let config = {
  headers: {
    authorization: token,
    "Content-Type": "application/json",
  },
};

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
      let audio = {
        audio_url: uploadUrl,
      };

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
                .get(`https://api.assemblyai.com/v2/transcript/${id}`, config)
                .then((res) => {
                  var status_of_transcipt = res.data.status;
                  console.log(status_of_transcipt);
                  if (
                    status_of_transcipt === "queued" ||
                    status_of_transcipt === "processing"
                  ) {
                    setTimeout(() => {
                      checkStatus();
                    }, 3000);
                  }
                  if (
                    status_of_transcipt === "error" ||
                    status_of_transcipt === "completed"
                  ) {
                    return console.log("broke function", res.data);
                  }
                  console.log(res.data.status);
                });
            }
            checkStatus();
          }
          console.log(res.data.id, res.data.status);
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

// var axios = require("axios");
// // var path = require("path");
// var fs = require("fs");
// // const Lame = require("node-lame").Lame;
// var url = "https://api.assemblyai.com/v2";
// var token = process.env.ASSEMBLY_API_TOKEN;
// var file = "Stark_audio.m4a";

// let config = {
//   headers: {
//     authorization: token,
//     "Content-Type": "application/json",
//   },
// };

// const submitAudio = (endpoint, data, config) => {
//   axios
//     .post(endpoint, data, config)
//     .then((response) => {
//       getTranscript(`${endpoint}/${response.data.id}`, config);
//     })
//     .catch((error) => console.log(error));
// };

// const getTranscript = (endpoint, config) => {
//   axios
//     .get(endpoint, config)
//     .then((response) => {
//       data = response.data;

//       if (data.status === "error") return console.log(data);
//       if (data.status === "completed") return console.log(data);

//       getTranscript(endpoint, config);
//     })
//     .catch((error) => console.log(error));
// };

// fs.readFile(file, (err, data) => {
//   if (err) return console.log(err);
//   // console.log(1, data);
//   axios
//     .post(`https://api.assemblyai.com/v2/upload`, data, {
//       headers: { "transfer-encoding": "chunked", authorization: token },
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//     })
//     .then((res) => {
//       const data = { audio_url: res.data.upload_url };
//       const endpoint = `${url}/transcript`;
//       submitAudio(endpoint, data, config);
//     })
//     .catch((err) => console.log(err));

//   //   await axios
//   //     .post("https://api.assemblyai.com/v2/transcript", audio, config)
//   //     .then((res) => {
//   //       //   console.log(res.data);
//   //       if (res.error) {
//   //         console.log(res.error);
//   //       } else {
//   //         let id = res.data.id;
//   //         let status_of_transcipt = res.data.status;

//   //         axios
//   //           .get(
//   //             `https://api.assemblyai.com/v2/transcript/hzh5h6ww9-1830-4bb2-bd70-655aed472ef4`,
//   //             config
//   //           )
//   //           .then((res) => {
//   //             console.log(res.data);
//   //           });
//   //       }
//   //       console.log(res.data.id, res.data.status);
//   //     });
//   // })
//   // .catch((err) => {
//   //   console.log(err);
//   // });
// });
