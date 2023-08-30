import axios from "axios";
import { useMemo } from "react";
import { erc20ABI, useNetwork, useSwitchNetwork } from "wagmi";
import { metadata } from "constants/data";
import { useApp } from "context/AppContext";
import { useParams } from "react-router-dom";
import { capitalizeFirst } from "helpers/text";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle } from "@phosphor-icons/react";
import { BarLoader, ClipLoader } from "react-spinners";
import {
  useAccount,
  useSignMessage,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";

const processing = ["pending", "failed"];

const Conersion = () => {
  let { uuid } = useParams();
  const { address } = useAccount();
  const { authorization, setAuthorization } = useApp();

  const { signMessageAsync, isLoading } = useSignMessage({
    message:
      "Message: Welcome to BridgeBloc!\nURI: https://bridgebloc.vercel.app",
  });

  const {
    data,
    refetch,
    error: dataError,
    isLoading: dataLoading,
  } = useQuery(
    ["conversion", uuid, authorization?.address, authorization?.signature],
    async () => {
      return await axios
        .get(`conversions/${uuid}`, {
          headers: {
            Authorization: `Signature ${authorization?.address}:${authorization?.signature}`,
          },
        })
        .then(response => response?.data?.data);
    },
    {
      refetchInterval: 15000,
      enabled:
        !!uuid &&
        authorization?.address === address &&
        !!authorization?.signature,
    }
  );

  const stepOne = useMemo(() => {
    return data?.conversion_steps
      ? data?.conversion_steps?.[0]?.status
      : "pending";
  }, [data]);

  const stepTwo = useMemo(() => {
    return data?.conversion_steps
      ? data?.conversion_steps?.[1]?.metadata?.deposit_tx_hash
        ? "success"
        : "pending"
      : "pending";
  }, [data]);

  const stepThree = useMemo(() => {
    return data?.conversion_steps
      ? data?.conversion_steps?.[2]?.status ?? "pending"
      : "pending";
  }, [data]);

  const chainIcons = useMemo(() => {
    const selected = Object.values(metadata).filter(
      (item: any) =>
        item.chain_id === data?.source_chain + "" ||
        item.chain_id === data?.destination_chain + ""
    );

    return {
      [data?.source_chain]: selected.find(
        (item: any) => item.chain_id === data?.source_chain + ""
      ),
      [data?.destination_chain]: selected.find(
        (item: any) => item.chain_id === data?.destination_chain + ""
      ),
    };
  }, [data?.source_chain, data?.destination_chain]);

  const { chain } = useNetwork();
  const { switchNetworkAsync } = useSwitchNetwork();

  const { config } = usePrepareContractWrite({
    abi: erc20ABI,
    functionName: "transfer",
    args: [
      data?.conversion_steps?.[0]?.metadata?.paymentMethods?.[0]?.address,
      BigInt(
        Number(data?.amount ?? 0) *
          Math.pow(10, Number(data?.source_token?.decimals ?? 0))
      ),
    ],
    chainId: data?.source_chain,
    address: data?.source_token?.address,
    // enabled: !!data?.source_token?.address && !!data?.amount,
  });

  const { writeAsync, isLoading: loading } = useContractWrite(config);

  const composeTxn = async (signature: string) => {
    try {
      const txn = await writeAsync?.();

      if (txn?.hash)
        await axios.post(
          `conversions/circle-api/${uuid}/add-deposit-hash`,
          {
            tx_hash: txn?.hash,
          },
          {
            headers: {
              Authorization: `Signature ${address}:${signature}`,
            },
          }
        );

      refetch();
    } catch (error) {
      console.log(error);
    }
  };

  const startPayment = async () => {
    if (!address) return;

    try {
      if (chain?.id !== data?.source_chain)
        await switchNetworkAsync?.(data?.source_chain);

      if (address !== authorization?.address || !authorization?.signature) {
        const signature = await signMessageAsync();
        if (signature) {
          setAuthorization({
            address,
            signature,
          });
          await composeTxn(signature);
        } else return;
      } else {
        await composeTxn(authorization?.signature);
      }
    } catch (error) {
      // @ts-ignore
      console.log(error?.message);
    }
  };

  return (
    <div className="conversion-page">
      <div className="conversion-container">
        <div className="conversion">
          <div className="conversion-header">
            <p className="title">Transaction Status</p>
            <p className="subtitle">
              Below is the current status of this bridge activity.
            </p>
          </div>

          <div className="conversion-details">
            <div className="conversion-details-item">
              <p className="title">Source chain</p>

              <div className="token">
                <div className="token-img">
                  <img
                    src={chainIcons?.[data?.source_chain]?.image_url}
                    alt={chainIcons?.[data?.source_chain]?.chain_name}
                  />
                </div>
                <p className="token-name">
                  {capitalizeFirst(
                    chainIcons?.[data?.source_chain]?.chain_name
                      ?.split("_")
                      .join(" ") ?? ""
                  )}
                </p>
              </div>
            </div>

            <div className="conversion-details-item">
              <p className="title">Destination chain</p>

              <div className="token">
                <div className="token-img">
                  <img
                    src={chainIcons?.[data?.destination_chain]?.image_url}
                    alt="eth"
                  />
                </div>
                <p className="token-name">
                  {capitalizeFirst(
                    chainIcons?.[data?.destination_chain]?.chain_name
                      ?.split("_")
                      .join(" ") ?? ""
                  )}
                </p>
              </div>
            </div>

            <div className="conversion-details-item">
              <p className="title">Source token</p>

              <div className="token">
                <div className="token-img">
                  <img
                    alt={data?.source_token?.name}
                    src={data?.source_token?.image_url}
                  />
                </div>
                <p
                  className="token-name"
                  style={{
                    textTransform: "uppercase",
                  }}
                >
                  {data?.source_token?.symbol?.split("_").join(" ")}
                </p>
              </div>
            </div>

            <div className="conversion-details-item">
              <p className="title">Destination token</p>

              <div className="token">
                <div className="token-img">
                  <img
                    alt={data?.destination_token?.name}
                    src={data?.destination_token?.image_url}
                  />
                </div>
                <p
                  className="token-name"
                  style={{
                    textTransform: "uppercase",
                  }}
                >
                  {data?.destination_token?.symbol?.split("_").join(" ")}
                </p>
              </div>
            </div>

            <div className="conversion-details-item">
              <p className="title">Amount</p>

              <div className="token">
                <p
                  className="token-name"
                  style={{
                    textTransform: "uppercase",
                  }}
                >
                  {data?.amount}{" "}
                  {data?.source_token?.symbol?.split("_").join(" ")}
                </p>
              </div>
            </div>
          </div>

          <div className="timeline">
            {[1, 2, 3, 4].map((item, index) => {
              return (
                <div
                  key={index}
                  data-active={
                    index <=
                    (processing.includes(stepOne)
                      ? 0
                      : processing.includes(stepTwo)
                      ? 1
                      : processing.includes(stepThree)
                      ? 2
                      : 3)
                  }
                  className="timeline-item"
                >
                  {item}
                </div>
              );
            })}

            <div className="timeline-cover">
              <div
                className="timeline-line"
                data-index={
                  processing.includes(stepOne)
                    ? 0
                    : processing.includes(stepTwo)
                    ? 1
                    : processing.includes(stepThree)
                    ? 2
                    : 3
                }
              />
            </div>
          </div>

          <div className="conversion-options">
            {dataLoading || dataError ? (
              <div className="step-message">
                <p className="title">
                  {dataError ? (
                    // @ts-ignore
                    <>{dataError?.response?.data?.errors?.[0]}</>
                  ) : (
                    <>Fetching transaction details</>
                  )}
                </p>
                {dataLoading && <BarLoader color={"#999"} />}
              </div>
            ) : (
              <>
                {processing.includes(stepOne) ? (
                  <div className="step-message">
                    <p className="title">
                      Hold on; we are creating a deposit address
                    </p>
                    <BarLoader color={"#999"} />
                  </div>
                ) : processing.includes(stepTwo) ? (
                  <button
                    className="primary-btn"
                    style={{
                      marginTop: "20px",
                    }}
                    onClick={() => startPayment()}
                  >
                    Pay
                    {(loading || isLoading) && (
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
                ) : processing.includes(stepThree) ? (
                  <div className="step-message">
                    <p
                      className="title"
                      style={{
                        lineHeight: 1.8,
                      }}
                    >
                      Wating for your deposit to be confirmed
                      <br />
                      Might take a while... ⏳
                    </p>
                    <BarLoader color={"#999"} />
                  </div>
                ) : (
                  <div
                    className="step-message"
                    style={{
                      gap: 7,
                      flexDirection: "row",
                    }}
                  >
                    <p
                      className="title"
                      style={{
                        fontSize: "18px",
                      }}
                    >
                      Transaction succesful
                    </p>
                    <CheckCircle size={19} weight="fill" color="#0FFF7F" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conersion;
