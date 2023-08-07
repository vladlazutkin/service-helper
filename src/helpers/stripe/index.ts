// export const getStripeCallbackUrl = (success: boolean) => {
//   if (process.env.NODE_ENV === 'production') {
//     return `${process.env.PROD_URL}/api/v1/stripe/${
//       success ? 'success' : 'cancel'
//     }?session_id={CHECKOUT_SESSION_ID}`;
//   }
//   return `http://localhost:${process.env.PORT}/api/v1/stripe/${
//     success ? 'success' : 'cancel'
//   }?session_id={CHECKOUT_SESSION_ID}`;
// };

export const getStripeCallbackUrl = (success: boolean) => {
  if (process.env.NODE_ENV === 'production') {
    return `${process.env.PROD_FRONTEND_URL}/skins?result=${
      success ? 'success' : 'fail'
    }`;
  }
  return `http://localhost:3000/skins?result=${success ? 'success' : 'fail'}`;
};

export const getStripeWebhookUrl = () => {
  return `${process.env.PROD_URL}/api/v1/stripe/webhook`;
};
