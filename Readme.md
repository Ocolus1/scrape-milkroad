# Web Scraper for Identifying Article Sponsors

This project is a web scraper built with Node.js, Puppeteer, Axios, and Langchain's OpenAI wrapper. It navigates to specific articles on a website, identifies sponsors, and writes the result to a JSON file.

## Dependencies

- `fs` (Node.js built-in)
- `puppeteer`
- `axios`
- `langchain/llms/openai`

## Functions

### `getSponsorsFromText(links, text)`

**Purpose**: Identifies sponsors from a list of links and article text.

- `links`: Array of hyperlinks
- `text`: Article content

This function uses the Langchain OpenAI API to identify sponsors based on specific UTM parameters. The API response is parsed to extract `companyName`, `website`, and `rootDomain`.

---

### `getArticles(page)`

**Purpose**: Scrape links of articles from a given webpage.

- `page`: Puppeteer page instance

The function returns an array of objects containing `link` and `date`.

---

### `clickTopRightCorner(page)`

**Purpose**: Clicks the top-right corner of the webpage.

- `page`: Puppeteer page instance

---

## Main Workflow (Async Function)

1. Launch Puppeteer browser.
2. Navigate to the initial URL.
3. Continuously loop through the following steps:
    1. Go to an article link.
    2. Extract relevant links within the article using a Puppeteer script.
    3. Call `getSponsorsFromText()` to identify the sponsors.
    4. Navigate to the next page of articles if available.
4. Close the browser.
5. Write the extracted sponsors to a `.json` file.

### Details

- **Timeout**: The script waits for 2 seconds after navigating to a URL and 8 seconds after clicking a "Next" button.
- **Exclusion**: The script avoids articles that are not from 2022 and excludes Milkroad or Twitter as sponsors.

## Output

The program writes the list of sponsors to a file called `sponsors.json` in a readable JSON format.

---

Note: This code is set to run in non-headless mode (`headless: true`) for debugging purposes.
