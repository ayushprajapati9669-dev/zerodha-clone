import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import "../styles/Funds.css";
function Funds() {
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [fundAmount, setFundAmount] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [fundError, setFundError] = useState("");
  const [fundTransactions, setFundTransactions] = useState([]);
  const {
    availableBalance,
    usedBalance,
    reservedBalance,
    setFundVersion,
    setFundToast,
    setIsOpenFundToast,
    fundVersion,
  } = useContext(AppContext);
  const handleAddFund = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    axios
      .post(
        `http://localhost:3000/api/funds/add`,
        {
          fundAmount: fundAmount,
        },
        { withCredentials: true },
      )
      .then(() => {
        setShowAddFundsModal(false);
        setFundVersion((prev) => prev + 1);
        setFundToast({
          message: "Fund added successfully",
          amount: Number(fundAmount),
        });
        setIsOpenFundToast(true);
        setFundAmount("");
      })
      .catch((err) => {
        console.log("error: ", err.response?.data);
      });
  };
  const handleWithdrawFund = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    axios
      .post(
        `http://localhost:3000/api/funds/withdraw`,
        {
          withdrawAmount: withdrawAmount,
        },
        { withCredentials: true },
      )
      .then(() => {
        setShowWithdrawModal(false);
        setFundVersion((prev) => prev + 1);
        setFundToast({
          message: "Fund withdrawn successfully",
          amount: Number(withdrawAmount),
        });
        setIsOpenFundToast(true);
        setWithdrawAmount("");
      })
      .catch((err) => {
        setFundError(err.response?.data?.message);

        console.log("error: ", err.response?.data);
      });

    setFundError("");
  };
  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/funds/transactions`, {
        withCredentials: true,
      })
      .then((res) => {
        setFundTransactions(res.data.transactions);
      })
      .catch((err) => {
        console.log(err.response?.data);
      });
  }, [fundVersion]);

  return (
    <div className="dashboard-container">
      <div className="mb-4 d-flex justify-content-between">
        <div>
          <h4>Funds</h4>
          <p className="text-muted">Manage your trading funds</p>
        </div>
        <div>
          <button
            className="btn btn-primary me-2 me-3"
            onClick={() => setShowAddFundsModal(true)}
          >
            Add Funds
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowWithdrawModal(true)}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="summary-card">
            <div className="summary-card-header">
              <span>Available Balance</span>
              <i className="bi bi-wallet2"></i>
            </div>

            <h3>₹{availableBalance.toLocaleString("en-IN")}</h3>

            <small className="text-muted">Available for trading</small>
          </div>
        </div>

        <div className="col-md-6">
          <div className="summary-card">
            <div className="summary-card-header">
              <span>Used Margin</span>
              <i className="bi bi-bar-chart"></i>
            </div>

            <h3>₹{usedBalance.toLocaleString("en-IN")}</h3>

            <small className="text-muted">Currently used</small>
          </div>
        </div>
        <div className="col-md-6">
          <div className="summary-card">
            <div className="summary-card-header">
              <span>Reserved Balance</span>
              <i className="bi bi-lock"></i>
            </div>

            <h3>₹{reservedBalance.toLocaleString("en-IN")}</h3>

            <small className="text-muted">Blocked for pending orders</small>
          </div>
        </div>
      </div>
      <div className="fund-breakdown">
        <div className="fund-breakdown-header">
          <h5>Fund Breakdown</h5>
        </div>

        <div className="fund-breakdown-list">
          <div className="fund-breakdown-row">
            <span>Available Balance</span>
            <strong>₹{availableBalance.toLocaleString("en-IN")}</strong>
          </div>

          <div className="fund-breakdown-row">
            <span>Used Margin</span>
            <strong>₹{usedBalance.toLocaleString("en-IN")}</strong>
          </div>

          <div className="fund-breakdown-row">
            <span>Reserved Balance</span>
            <strong>₹{reservedBalance.toLocaleString("en-IN")}</strong>
          </div>

          <div className="fund-breakdown-divider"></div>

          <div className="fund-breakdown-row total">
            <span>Total Funds</span>
            <strong>
              ₹
              {(
                availableBalance +
                usedBalance +
                reservedBalance
              ).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>
      </div>
      <div className="available-trade-section">
        <div className="available-trade-header">
          <div>
            <h5>Available to Trade</h5>
            <small>Amount available for placing new orders</small>
          </div>

          <i className="bi bi-wallet2"></i>
        </div>

        <div className="available-trade-amount">
          ₹{availableBalance.toLocaleString("en-IN")}
        </div>

        <div className="available-trade-details">
          <div>
            <span>Available Balance</span>
            <strong>₹{availableBalance.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span>Reserved Balance</span>
            <strong>₹{reservedBalance.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>
      <div className="fund-transactions">
        <div className="fund-transactions-header">
          <h5>Recent Transactions</h5>
        </div>
        {fundTransactions.length === 0 && (
          <div className="no-transaction">
            <div className="no-transaction-icon">📭</div>
            <h4>No transactions found</h4>
            <p>Your fund transaction history will appear here.</p>
          </div>
        )}
        <div className="fund-transactions-list">
          {fundTransactions?.map((transaction) => {
            const formattedDate = new Date(
              transaction.createdAt,
            ).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
            return (
              <div className="fund-transaction-row" key={transaction._id}>
                <div className="fund-transaction-info">
                  <div
                    className={
                      transaction.type === "add"
                        ? "fund-transaction-icon add"
                        : "fund-transaction-icon withdraw"
                    }
                  >
                    <i
                      className={
                        transaction.type === "add"
                          ? "bi bi-plus-lg"
                          : "bi bi-arrow-down-left"
                      }
                    ></i>
                  </div>

                  <div>
                    {transaction.type === "add" ? (
                      <strong>Funds Added</strong>
                    ) : (
                      <strong>Funds Withdrawn</strong>
                    )}
                    <small>{formattedDate}</small>
                  </div>
                </div>

                {transaction.type === "add" ? (
                  <strong className="fund-transaction-amount add">
                    +₹{transaction.amount.toLocaleString("en-IN")}
                  </strong>
                ) : (
                  <strong className="fund-transaction-amount withdraw">
                    -₹{transaction.amount.toLocaleString("en-IN")}
                  </strong>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4">
        {showAddFundsModal && (
          <div className="fund-modal-overlay">
            <div className="fund-modal">
              <div className="fund-modal-header">
                <h5>Add Funds</h5>

                <button
                  type="button"
                  onClick={() => setShowAddFundsModal(false)}
                >
                  &times;
                </button>
              </div>

              <form
                className="fund-modal-body"
                onSubmit={handleAddFund}
                noValidate
              >
                <label htmlFor="fundAmount">Amount</label>

                <input
                  id="fundAmount"
                  value={fundAmount}
                  type="number"
                  className="form-control"
                  placeholder="Enter amount"
                  min="1"
                  required
                  onChange={(e) => {
                    setFundAmount(e.target.value);
                  }}
                />

                <div className="invalid-feedback">Please enter amount</div>

                <div className="fund-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddFundsModal(false)}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="btn btn-primary">
                    Add Funds
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showWithdrawModal && (
          <div className="fund-modal-overlay">
            <div className="fund-modal">
              <div className="fund-modal-header">
                <h5>Withdraw Funds</h5>

                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                >
                  &times;
                </button>
              </div>

              <form
                className="fund-modal-body"
                onSubmit={handleWithdrawFund}
                noValidate
              >
                {/* Available Balance */}
                <div className="withdraw-available-balance">
                  <span>Available Balance</span>
                  <strong>₹{availableBalance.toLocaleString("en-IN")}</strong>
                </div>

                {/* Withdraw Amount */}
                <div className="withdraw-amount-section">
                  <label htmlFor="withdrawAmount">Amount</label>

                  <input
                    id="withdrawAmount"
                    type="number"
                    className={`form-control ${fundError ? "is-invalid" : ""}`}
                    placeholder="Enter amount"
                    min="1"
                    required
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      setFundError("");
                    }}
                  />

                  <div className="invalid-feedback">
                    {fundError || "Please enter amount"}
                  </div>
                </div>

                {/* Footer */}
                <div className="fund-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowWithdrawModal(false)}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="btn btn-primary">
                    Withdraw Funds
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Funds;
