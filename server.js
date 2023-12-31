const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const dotenv = require('dotenv');
const port = process.env.PORT || 8080;
const app = express();
app.use(express.static("public"));
app.use(express.static('dist'));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(cors({ origin: true, credentials: true }));

dotenv.config({ path: '.env' });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.post("/checkout", async (req, res, next) => {

  console.table(req.body.items);

    try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          shipping_address_collection: {
            allowed_countries: ['US', 'CA', 'FR'],
          },
          shipping_options: [
          {
              shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                  amount: 0,
                  currency: 'usd',
              },
              display_name: 'Free shipping',
              // Delivers between 5-7 business days
              delivery_estimate: {
                  minimum: {
                  unit: 'business_day',
                  value: 5,
                  },
                  maximum: {
                  unit: 'business_day',
                  value: 7,
                  },
              }
              }
          },
          {
              shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                  amount: 1500,
                  currency: 'usd',
              },
              display_name: 'Next day air',
              // Delivers in exactly 1 business day
              delivery_estimate: {
                  minimum: {
                  unit: 'business_day',
                  value: 1,
                  },
                  maximum: {
                  unit: 'business_day',
                  value: 1,
                  },
              }
              }
          },
          ],
          line_items:  req.body.items.map((item) => ({
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name,
                images: [item.product]
              },
              unit_amount: item.price * 100,
            },
            quantity: item.quantity
          })),
          mode: "payment",
          success_url: `${process.env.SERVER_URL}/success.html`,
          cancel_url: `${process.env.SERVER_URL}/cancel.html`,
        });
        res.status(200).json(session);
    } catch (error) {
        next(error);
    }

});

app.all('/*', function(req, res) {
  res.sendFile('dist/index.html', { root: __dirname });
});

var opn = require('opn');

opn(process.env.CLIENT_URL).then(() => {
  console.log('Browser closed.');
});

app.listen(port, () => console.log(`app is running on ${port}`));
