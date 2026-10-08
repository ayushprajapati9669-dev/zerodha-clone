import Holding from "../models/HoldingsModel.js";
const getAllHoldings = async (req, res) => {
      const userId = req.user.userId;
      try {

            let data = await Holding.find({ userId });

            res.json(data);
      } catch (err) {
            console.log("error to fetch holdings data: ", err);
            res.status(500).json({
                  message: "failed to fetch holdings data",
                  error: err.message
            })
      }


}
export default getAllHoldings;