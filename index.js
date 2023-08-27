// Import required libraries
const fs = require('fs');
const puppeteer = require('puppeteer');
const axios = require('axios');
const { OpenAI } = require('langchain/llms/openai');

// Initialize OpenAI API
const llm = new OpenAI({
	openAIApiKey: process.env.OPENAI_API_KEY,
});

// Function to get sponsors from text
const getSponsorsFromText = async (links, text) => {
	// GPT-3 prompt for getting sponsor details
	const prompt = `
    Given the following text and the a tag links, identify the sponsor or sponsors of the newsletter
    and their respective websites and output them in this format 
    [{
        companyName: 'Sample Company',
        website: 'https://www.cryptoslam.io/?utm_source=milkroad&utm_medium=milkroad&utm_campaign=milkroad',
		rootDomain: 'https://www.cryptoslam.io'
    }]

	You can identify a sponsor my checking the links that has a href tag which 
	contains utm_source=milkroad or utm_medium=milkroad or utm_campaign=milkroad or 
	utm_campaign or utm_source or utm_medium. if they are no sponsors return an empty array.
	let the website field have the full link in the href along with this utm_campaign or utm_source or utm_medium
	if it is in the href. 

	exclude content or sponsor like this 
	{
    companyName: 'Milk Road Daily',
    website: 'https://twitter.com/MilkRoadDaily/status/1602321208003162112?s=20&t=m61vN128m0_495-7G8DZGg',
    rootDomain: 'https://twitter.com'
  	},
	{
    companyName: 'Milkroad',
    website: 'https://milkroad.com/?utm_source=milkroad&utm_medium=milkroad&utm_campaign=milkroad',
    rootDomain: 'https://milkroad.com'
  	},

	exclude company name that is Milkroad and urls that have milkroad or twitter in it.
	exclude links that have twitter.com in them
	
	\n ${links}

    \n ${text}
    `;
	try {
		// Query the GPT-3 model
		const res = await llm.call(prompt);

		// Initialize sponsors array to hold the parsed sponsor(s)
		const sponsors = [];

		// Regex pattern to capture companyName and website from GPT-3 response
		const regexPattern = /companyName: '([^']*)',\s*website: '([^']*)'/g;

		// Extract sponsors using regular expression
		let match;
		while ((match = regexPattern.exec(res)) !== null) {
			// Extract values
			const companyName = match[1];
			const website = match[2];

			// Extract root domain from the website
			const url = new URL(website);
			const rootDomain = `${url.protocol}//${url.hostname}`;

			// Add sponsor to sponsors array
			sponsors.push({
				companyName,
				website,
				rootDomain,
			});
		}

		// Return sponsors array with parsed sponsor(s)
		return sponsors;
	} catch (error) {
		// Log any errors
		console.error('Error querying GPT:', error);
		return [];
	}
};


// Function to get articles from a page
const getArticles = async (page) => {
	// Evaluate JavaScript on the page to scrape articles
	return await page.evaluate(() => {
		const articles = [];
		// Query the articles on the page
		document.querySelectorAll('article').forEach((article) => {
			const date = article.querySelector('.date')?.textContent || '';
			const linkElement = article.querySelector('.post-title a');
			const link = linkElement ? linkElement.getAttribute('href') : '';
			if (date.includes('2022') && link) {
				articles.push({ link, date });
			}
		});
		return articles;
	});
};

// Function to click the top right corner of the page
// to close popup subscribe div
const clickTopRightCorner = async (page) => {
	// Get viewport dimensions
	const viewport = page.viewport();
	// Click top right corner
	await page.mouse.click(viewport.width - 10, 10);
};


// Main function
(async () => {
	// Launch Puppeteer browser
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	let url = 'https://milkroad.com/daily/?sf_paged=10';
	let sponsors = [];

	while (true) {
		// Log and navigate to URL
		console.log('Navigating to URL:', url);
		await page.goto(url, { timeout: 100000 });

		await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds
		await clickTopRightCorner(page); // Click the top-right corner (custom functions)

		// Scrape articles from the page
		const articles = await getArticles(page);

		// Loop through each article
		for (const { link } of articles) {
			// Go to each article's link
			await page.goto(link, { timeout: 100000 });

			await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds

			await clickTopRightCorner(page); // Click the top-right corner

			// Extract links from div with class "entry-content"
			const articleLinks = await page.$eval(
				'div.entry-content',
				(el) => Array.from(el.querySelectorAll('a')).map((a) => a.href) // Gets all the 'href' of the links
			);

			// Scrape text content from the article
			const articleText = await page.$eval(
				'article',
				(el) => el.textContent || ''
			);

			const articleLinksText = articleLinks.join('\n'); // Join all the links by newline

			// Get sponsors from the article (custom function)
			const articleSponsors = await getSponsorsFromText(
				articleLinksText,
				articleText
			);

			// Add new sponsors to the list
			sponsors = [...sponsors, ...articleSponsors];

			// Navigate back to list page
			await page.goto(url, { timeout: 100000 });
			await new Promise((resolve) => setTimeout(resolve, 6000));
		}

		// Check for 'Next' link
		const nextLink = await page.$('a.nextpostslink');
		if (nextLink) {
			// Get URL for the 'Next' link
			const relativeUrl = await page.evaluate(
				(el) => el.getAttribute('href') || '',
				nextLink
			);

			// Update the URL for the next loop iteration
			url = relativeUrl.startsWith('/')
				? `https://milkroad.com${relativeUrl}`
				: relativeUrl;

			await nextLink.click(); // Clicking the "Next" button

			console.log('the full sponsor list :- ', sponsors);

			await new Promise((resolve) => setTimeout(resolve, 8000)); // wait 8 seconds AFTER clicking
		} else {
			// Break if there is no 'Next' link
			break;
		}
	}

	// Close the browser
	await browser.close();

	// Write the sponsors array to a .json file
	fs.writeFileSync('sponsors.json', JSON.stringify(sponsors, null, 2));
})();
