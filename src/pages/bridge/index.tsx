import { useApp } from "context/AppContext";
import { ClipLoader } from "react-spinners";
import TxnToken from "./components/sourceToken";
import SourceChain from "./components/sourceChain";
import DestinationChain from "./components/destinationChain";
import DestinationToken from "./components/destinationToken";

const Bridge = () => {
  const { currentRoute, fetchQuotes, signMessageLoading, quotesRequest } =
    useApp();

  return (
    <div className="bridge-page">
      <div className="bridge-container">
        <div className="bridge">
          <div className="bridge-header">
            <p className="title">Bridge Tokens</p>
            <p className="subtitle">
              Transfer your tokens from one network to the other.
            </p>
          </div>

          <div className="bridge-options">
            <SourceChain />
            <DestinationChain />
            <TxnToken />
            <DestinationToken />

            {currentRoute?.route && (
              <div className="bridge-block">
                <p>
                  This process will make use of{" "}
                  <span
                    style={{
                      textTransform: "capitalize",
                    }}
                  >
                    {currentRoute?.route?.split("_").join(" ")}
                  </span>
                </p>
              </div>
            )}

            <button
              className="primary-btn"
              style={{
                marginTop: "20px",
              }}
              onClick={fetchQuotes}
            >
              Continue
              {(quotesRequest.isLoading || signMessageLoading) && (
                <ClipLoader
                  size={16}
                  color={"#888"}
                  cssOverride={{
                    right: 20,
                    position: "absolute",
                  }}
                  aria-label="Loading Spinner"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bridge;
