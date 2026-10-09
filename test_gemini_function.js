async function testGem() {
  const url = 'https://us-central1-vajra-inventory-e9068.cloudfunctions.net/testGemini';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {}
      })
    });
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
testGem();
