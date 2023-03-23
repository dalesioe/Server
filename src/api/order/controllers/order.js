"use strict";
const stripe = require("stripe")(
  "sk_test_51Mj6l7KKrGynCsPoSzWQ7d6Qi3JHoEAZjqG0Ac3eUiDf64vRhK4c735bn65dobvi9ct2c6mfk3VDguZO9gi8oIOs00PLgqypKF"
);

function calcDiscountPrice(price, discount) {
  if (!discount) {
    return price;
  }
  const discountPrice = (price * discount) / 100;
  const result = price - discountPrice;
  return result.toFixed(2);
}
/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

//TOMA VALORES DEL PEDIDO
module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {
    const { token, products, idUser, addressShipping } = ctx.request.body;

    //CALCULO EL TOTAL A PAGAR
    let totalPayment = 0;
    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );
      total;

      totalPayment += Number(priceTemp) * product.quantity;
    });

    //CREA EL PAGO EN STRIPE
    const charge = await stripe.charges.create({
      amount: Math.round(totalPayment * 100),
      currency: "eur",
      source: token.id,
      description: `User ID: ${idUser}`,
    });

    //CARGO DATOS PARA GUARDAR EN STRAPI
    const data = {
      products,
      user: idUser,
      totalPayment,
      idPayment: charge.id,
      addressShipping,
    };

    //VALIDO QUE LA ENTIDAD SEA LA CORRECTA
    const model = strapi.contentTypes["api::order.order"];
    const validData = await strapi.entityValidator.validateEntityCreator(
      model,
      data
    );

    //GUARDO EN STRAPI
    const entry = await strapi.db
      .query("api::order.order")
      .create({ data: validData });
    return entry;
  },
}));
