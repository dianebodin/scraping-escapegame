const puppeteer = require('puppeteer');
const fs = require('fs');


const URL = "https://www.escapegame.fr/paris/";
let res = [];


const saveToFile = (data) => {
  fs.writeFile("./result.json", JSON.stringify(data), "utf8", (err) => {
    if (err) console.log(err);
    else console.log("Scraping terminé")
  });
}


const getGames = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle2" });

  const games = await page.evaluate(() => {
    return [...document.querySelectorAll("#jsRooms > .card-room")].map(el => {
      return {
        name: el.querySelector(".card-title a").textContent,
        company: el.querySelector(".card-room-brand").textContent,
        description: el.querySelector(".room-summary").textContent.trim(),
        snooping: el.querySelector(".room-snooping") && Number(el.querySelector(".room-snooping").textContent.trim().split(" ")[0].slice(0, -1)),
        handling: el.querySelector(".room-handling") && Number(el.querySelector(".room-handling").textContent.trim().split(" ")[0].slice(0, -1)),
        thinking: el.querySelector(".room-thinking") && Number(el.querySelector(".room-thinking").textContent.trim().split(" ")[0].slice(0, -1)),
        rating: el.querySelector(".rating-full") && Number(Number(el.querySelector(".rating-full").getAttribute("style").split(" ")[1].slice(0, -3) / 17).toFixed(1)),
        satisfication: el.querySelector(".user-rating") && Number(el.querySelector(".user-rating").textContent.trim().slice(0, 2)),
        thumbnail: el.querySelector(".card-room-hero-image").getAttribute("data-src").split("?")[0],
        domain: el.querySelector(".card-title a").getAttribute("href"),
      }
    });
  });

  await browser.close();
  res = games;
  getMoreAboutGames(0);
}


getGames();


const getMoreAboutGames = async (index) => {
  if (index < res.length - 1) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(res[index].domain, { waitUntil: "networkidle2" });

    const summary = await page.evaluate(() => 
      document.querySelector(".entry-content").innerText);

    const availabilities = await page.evaluate(() => 
      document.querySelector(".button-blue.button-block") && document.querySelector(".button-blue.button-block").getAttribute("href").split("?")[0]);

    const addresses = await page.evaluate(() => {
      if (document.querySelector(".room-location")) {
        return [...document.querySelectorAll(".room-address")].map(el => {
          return {
            link: el.getAttribute("href"),
            location: el.innerText,
            coords: {
              lat: el.getAttribute("href").split("=")[1].split(",")[0],
              lon: el.getAttribute("href").split("=")[1].split(",")[1],
            }
          }
        });
      }
      return null;
    });

    const booking = await page.evaluate(() => 
      document.querySelector(".sticky-cta-sm") && document.querySelector(".sticky-cta-sm a").getAttribute("href").split("?")[0]);

    const specificities = await page.evaluate(() => {
      return [...document.querySelectorAll(".room-specs li")].map(el => {
        const key = el.innerText.split("\n")[0];
        const value = el.innerText.split("\n")[1];
        return {
          [key]: value,
        };
      })
    });

    await browser.close();
    res[index] = {
      ...res[index],
      summary,
      availabilities,
      addresses,
      booking,
      specificities,
    }

    index++;
    console.log(`L'escape game ${res[index].name} a bien été scrapé`)
    getMoreAboutGames(index);

  } else saveToFile(res);
}