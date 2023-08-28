const fs = require('fs');

// Function to remove duplicate sponsors
const removeDuplicateSponsors = (sponsors) => {
	// Use a Set to keep track of unique JSON strings
	const uniqueSponsorsSet = new Set();

	// Result array to hold unique sponsors
	const uniqueSponsors = [];

	sponsors.forEach((sponsor) => {
		// Convert each sponsor object to a JSON string
		const sponsorJsonStr = JSON.stringify(sponsor);

		// If this sponsor is not already in the Set, add it to both the Set and the result array
		if (!uniqueSponsorsSet.has(sponsorJsonStr)) {
			uniqueSponsorsSet.add(sponsorJsonStr);
			uniqueSponsors.push(sponsor);
		}
	});

	return uniqueSponsors;
};

// Read sponsors.json file
fs.readFile('sponsors.json', 'utf8', (err, data) => {
	if (err) {
		console.error('Error reading the file:', err);
		return;
	}

	// Parse the JSON string to an object
	const sponsors = JSON.parse(data);

	// Remove duplicates
	const uniqueSponsors = removeDuplicateSponsors(sponsors);

	// Write the unique sponsors to a new file
	fs.writeFileSync(
		'sponsors_unique.json',
		JSON.stringify(uniqueSponsors, null, 2)
	);
});
