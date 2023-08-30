import {
  useMemo,
  Dispatch,
  useState,
  ReactNode,
  useEffect,
  useContext,
  ReactElement,
  createContext,
  SetStateAction,
} from "react";
import axios from "axios";
import { useNetworkState } from "react-use";
import { useNavigate } from "react-router-dom";
import { metadata, tokens } from "constants/data";
import { useAccount, useQuery, useSignMessage } from "wagmi";
import { UseBaseMutationResult, useMutation } from "@tanstack/react-query";

interface AppProviderProps {
  children: ReactElement | ReactElement[] | ReactNode;
}

interface AppContextType {
  routes: any;
  chainIcon: string;
  currentToken: any;
  chainTokens: any[];
  chainRoutes: any[];
  currentRoute: any;
  transferAmt: string;
  currentChain: string;
  receivedValue: string;
  destinationToken: any;
  authorization: {
    address: string;
    signature: string;
  };
  signMessageLoading: boolean;
  setCurrentToken: Dispatch<SetStateAction<any>>;
  setAuthorization: Dispatch<SetStateAction<any>>;
  setTransferAmt: Dispatch<SetStateAction<string>>;
  setCurrentRoute: Dispatch<SetStateAction<string>>;
  setCurrentChain: Dispatch<SetStateAction<string>>;
  setDestinationToken: Dispatch<SetStateAction<any>>;

  fetchQuotes: () => Promise<any>;
  currentNetworkTokens: any[];
  quotesRequest: UseBaseMutationResult<any, unknown, any, unknown>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useApp = (): AppContextType => useContext(AppContext);

type QuotesPayload = {
  address: string;
  signature: string;
};

const AppProvider = ({ children }: AppProviderProps) => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const onlineState = useNetworkState();
  const { signMessageAsync, isLoading: signMessageLoading } = useSignMessage({
    message:
      "Message: Welcome to BridgeBloc!\nURI: https://bridgebloc.vercel.app",
  });

  const [authorization, setAuthorization] = useState({
    address: "",
    signature: "",
  });

  const [transferAmt, setTransferAmt] = useState("");
  const [currentRoute, setCurrentRoute] = useState<any>({});
  const [currentChain, setCurrentChain] = useState("ethereum");
  const [destinationToken, setDestinationToken] = useState<any>({});
  const [currentToken, setCurrentToken] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const auth = localStorage.getItem("authorization");
    if (auth) setAuthorization(JSON.parse(auth));
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("authorization");

    if (auth && address) setAuthorization(JSON.parse(auth));
    else
      setAuthorization({
        address: "",
        signature: "",
      });
  }, [address]);

  useEffect(() => {
    if (authorization.address && authorization.signature)
      localStorage.setItem("authorization", JSON.stringify(authorization));
  }, [authorization]);

  const quotesRequest = useMutation({
    mutationFn: async (payload: QuotesPayload) => {
      return await axios
        .post(
          "/conversions/circle-api",
          {
            source_chain: currentChain,
            destination_address: address,
            source_token: currentToken?.address,
            destination_chain: currentRoute?.chain,
            destination_token: destinationToken?.address,
            amount: isNaN(Number(transferAmt)) ? 0 : Number(transferAmt),
          },
          {
            headers: {
              Authorization: `Signature ${payload?.address}:${payload?.signature}`,
            },
          }
        )
        .then(response => response?.data?.data);
    },
    onSuccess: data => {
      navigate(`/conversion/${data?.id}`);
    },
  });

  const fetchQuotes = async () => {
    if (!address) return;
    if (!onlineState.online) return;

    try {
      if (address !== authorization?.address || !authorization?.signature) {
        const signature = await signMessageAsync();

        if (signature) {
          setAuthorization({
            address,
            signature,
          });
          quotesRequest.mutate({
            address,
            signature,
          });
        } else return;
      } else {
        quotesRequest.mutate({
          address,
          signature: authorization?.signature,
        });
      }
    } catch (error) {
      // @ts-ignore
      console.log(error?.message);
    }
  };

  const conversions = useQuery(
    ["tokens"],
    async () => {
      return await axios
        .get("conversions/routes")
        .then(response => response?.data?.data);
    },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const routes = useMemo(() => {
    const routesArr = Object.keys(conversions.data || {});
    return routesArr.map(chain => {
      return {
        chain,
        image_url: metadata?.[chain]?.image_url ?? "",
      };
    });
  }, [conversions.data]);

  const chainRoutes = useMemo(() => {
    const routesArr = conversions.data?.[currentChain];
    return Object.keys(routesArr || {}).map(chain => {
      return {
        chain,
        route: routesArr?.[chain] ?? "",
        image_url: metadata?.[chain]?.image_url ?? "",
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChain]);

  const chainIcon = useMemo(() => {
    return metadata?.[currentChain]?.image_url ?? "";
  }, [currentChain]);

  const chainTokens = useMemo(() => {
    return tokens.filter(token => token.chain_name === currentChain);
  }, [currentChain]);

  const receivedValue = useMemo(() => {
    return (
      isNaN(Number(transferAmt)) ? 0 : Number(transferAmt) * 0.926781
    ).toFixed(4);
  }, [transferAmt]);

  const currentNetworkTokens = useMemo(() => {
    return tokens.filter(token => token.chain_name === currentRoute?.chain);
  }, [currentRoute]);

  return (
    <AppContext.Provider
      value={{
        routes,
        chainIcon,
        chainTokens,
        chainRoutes,
        transferAmt,
        setTransferAmt,
        receivedValue,
        currentToken,
        setCurrentToken,
        currentChain,
        setCurrentChain,
        destinationToken,
        setDestinationToken,
        currentRoute,
        setCurrentRoute,
        currentNetworkTokens,

        authorization,

        fetchQuotes,
        quotesRequest,
        setAuthorization,
        signMessageLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
