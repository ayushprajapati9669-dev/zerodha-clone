import Position from "../models/PositionsModel.js";
const getAllPositions = async (req, res) => {
      const userId=req.user.userId
      try {
            let response = (await Position.find({userId}));

            res.json(response);
      } catch (err) {
            res.status(500).json({
                  message: "failed to fetch positions data",
                  error: err.message
            })
      }
}
export default getAllPositions;