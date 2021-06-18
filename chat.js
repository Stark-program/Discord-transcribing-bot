const axios = require("axios");
const fs = require("fs");

const url = "https://api.assemblyai.com/v2";
const token = "Your Token";

const file = "File Path";

fs.readFile(file, (err, data) => {
  if (err) return console.log(err);

  axios
    .post(`${url}/upload`, data, {
      headers: { "transfer-encoding": "chunked", authorization: token },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => console.error(err));
});
