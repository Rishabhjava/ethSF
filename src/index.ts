import express, { Application, Request, Response } from "express";
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets'



const client = initiateDeveloperControlledWalletsClient({
  apiKey: 'TEST_API_KEY:1438553eddc3d1df9be5dc6c3754e965:49a7de9211f8a451e210bb83d448571d',
  entitySecret: 'e1c03db0a04b50b33b018f2d8f3fcbc2693b6a248015e761943e555cd954a585',
})


const app: Application = express();
const port = 6969;


app.get("/", (req: any, res: any) => {
  res.send("Hello from TypeScript Express!");
});

// Updated endpoint to get wallet balance for all tokens
app.get("/getWalletBalance", async (req: any, res: any) => {
  try {
    const walletId = '9da85f45-5ea4-5709-9c77-7e5c9ceec666';
    const response: any = await client.getWalletTokenBalance({
      id: walletId
    });

    // Extract ticker (symbol) and amount for each token
    const balanceInfo = response.data.tokenBalances.reduce((acc: Record<string, string>, tokenBalance: any) => {
      acc[tokenBalance.token.symbol] = tokenBalance.amount;
      return acc;
    }, {});

    res.json(balanceInfo);
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
});

//here I will write an endpoint which when called will check the balance of the wallet for a particular token and if it is there then it will send wbtc to a specific address

// New endpoint to check balance and send WBTC
app.post("/checkAndSendWBTC", async (req: any, res: any) => {
  try {
    const { walletId, destinationAddress, amountToSend } = req.body;

    // Hardcode WBTC token ID and symbol
    const WBTC_TOKEN_ID = '1a4b2b5f-3f4b-5fd8-b19a-f88e8f6c85bf'; // Replace with actual WBTC token ID
    const WBTC_SYMBOL = 'WBTC';

    // First, get the wallet balance
    const balanceResponse: any = await client.getWalletTokenBalance({
      id: walletId
    });

    // Find the balance of WBTC
    const wbtcBalance = balanceResponse.data.tokenBalances.find(
      (balance: any) => balance.token.symbol === WBTC_SYMBOL
    );

    if (!wbtcBalance || parseFloat(wbtcBalance.amount) < parseFloat(amountToSend)) {
      return res.status(400).json({ error: "Insufficient WBTC balance" });
    }

    // If balance is sufficient, proceed with the transaction
    const transactionResponse = await client.createTransaction({
      walletId: walletId,
      tokenId: WBTC_TOKEN_ID,
      destinationAddress: destinationAddress,
      amount: amountToSend,
      fee: {
        type: 'level',
        config: {
          feeLevel: 'HIGH'
        }
      }
    });

    res.json({
      message: "WBTC transaction created successfully",
      transactionDetails: transactionResponse.data
    });

  } catch (error) {
    console.error("Error creating WBTC transaction:", error);
    res.status(500).json({ error: "Failed to create WBTC transaction" });
  }
});



app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
