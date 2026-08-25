const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const phoneId = process.env.META_WHATSAPP_PHONE_ID;
const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

async function test() {
  const toPhone = process.argv[2] || "7697544446";
  const formattedPhone = toPhone.replace(/\D/g, "").length === 10 ? `91${toPhone.replace(/\D/g, "")}` : toPhone.replace(/\D/g, "");

  console.log("Sending Hello World template to", formattedPhone);
  
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Meta API Error:", JSON.stringify(data, null, 2));
    } else {
      console.log("SUCCESS! Message ID:", data.messages[0].id);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
