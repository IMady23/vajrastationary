async function trigger() {
  const url = 'https://us-central1-vajra-inventory-e9068.cloudfunctions.net/recognizeProduct';
  
  // A tiny valid 1x1 JPEG pixel Data URL to test the base64 decoding pipeline
  const validJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          imageBase64: validJpeg
        }
      })
    });
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
trigger();
