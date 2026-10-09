const fs = require('fs');

async function test() {
    const b64 = fs.readFileSync('test.png').toString('base64');
    const imageBase64 = "data:image/png;base64," + b64;
    
    console.log("Sending payload of size: " + imageBase64.length);

    try {
        const response = await fetch('https://us-central1-vajra-inventory-e9068.cloudfunctions.net/recognizeProduct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    imageBase64: imageBase64
                }
            })
        });

        const result = await response.json();
        console.log("Response:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

test();
