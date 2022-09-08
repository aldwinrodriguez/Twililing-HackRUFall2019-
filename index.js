const express = require("express");

const MessagingResponse = require("twilio").twiml.MessagingResponse;
const request = require("request");
const cheerio = require("cheerio");

const { urlencoded } = require("body-parser");

const app = express();
app.use(
  urlencoded({
    extended: false,
  })
);

app.post("/sms", (req, res) => {
  // TODO: convenience feature, E.g. when user send "1", then use the previous argument from history (use Twilio Retrieve message)
  // and use that as an argument
  const twiml = new MessagingResponse();

  const arg = req.body.Body;

  let args = [];
  let counter = 0;

  // Splices words separated by commas, then add them to an Array
  for (let i = 0; i < arg.length; i++) {
    if (arg[i] == ",") {
      args.push(arg.substring(counter, i));
      counter = i + 2;
    }
  }
  args.push(arg.substring(counter, arg.length));

  let obj = {
    uri: "https://www.snagajob.com/search",
    qs: {
      // q is job field
      q: args[0],
      radius: "20",
      // w is zip code
      w: args[1],
      // promotedonly is urgenthiring
      promotedonly: args[2],
    },
  };

  request(obj, function (error, response, body) {
    const $ = cheerio.load(body);
    let mess = "";
    console.log($);
    const job_position = [];
    const job_company = [];
    const job_location = [];

    $(".job-card--title").each(function (i, elem) {
      job_position[i] = $(this).text();
    });
    $('[data-snagtag="company-name"]').each(function (i, elem) {
      job_company[i] = $(this).text();
    });
    $('[data-snagtag="job-address"]').each(function (i, elem) {
      let element = $(this).text();
      let sw = false;
      for (let i = element.length - 1; i > 0; i--) {
        if (element[i] == "," && !sw) sw = true;
        else if (element[i] == "," && sw) {
          element = element.substring(i + 1, element.length);
          break;
        }
      }
      job_location[i] = element;
    });

    for (let i = 0; i < 10; i++) {
      mess =
        mess +
        `\n${job_company[i]} \n🏢 ${job_position[i]} \n🌍${job_location[i]}\n\n`;
    }

    let ur =
      obj.uri + "?q=" + args[0].replace(" ", "+") + "&radius=20&w=" + args[1];
    mess += `\nVisit: ${ur}`;

    // TODO: add multiple messages, so that u can send more query messages
    twiml.message(mess);

    res.writeHead(200, {
      "Content-Type": "text/xml",
    });
    res.end(twiml.toString());
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);

// app.listen(1337, () => console.log('Express server listening on port 1337'));
