import { LoaderFunctionArgs } from "react-router-dom";

export const BillDetailsLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const billId = params.billId;

    const response = await fetch(`http://localhost:5000/bill/${billId}`, {
      credentials: "include",
    });
    const data = await response.json();

    return { error: false, data };
  } catch (e) {
    console.error(e);
    return { error: true };
  }
};
