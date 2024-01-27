import React, { useState, useEffect, useContext, createContext } from "react";
import axios from "axios";
import {
  useAddress,
  useContract,
  useMetamask,
  // New hooks for the FRONTEND
  useDisconnect,
  useSigner,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(
    "0x6682a233413D2ae4fcfA9ec6a0c9839961A6C30E"
  );
  const address = useAddress();
  const connect = useMetamask();

  // FrontEnd
  const disconnect = useDisconnect();
  const signer = useSigner();
  const [userBlance, setUserBlance] = useState();
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      // User Balance
      const balance = await signer?.getBalance();
      const userBalance = address
        ? ethers.utils.formatEther(balance?.toString())
        : "";
      setUserBlance(userBalance);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Contract Function
  // --Upload
  const uploadImage = async (imageInfo) => {
    const { title, description, email, category, image } = imageInfo;

    try {
      // Charge
      const listingPrice = await contract.call("listingPrice");

      const createNFTs = await contract.call(
        "uploadIPFS",
        [address, image, title, description, email, category],
        {
          value: listingPrice.toString(),
        }
      );

      // API call
      const response = await axios({
        method: "POST",
        url: `/api/v1/NFTs`,
        data: {
          title: title,
          description: description,
          category: category,
          image: image,
          address: address,
          email: email,
        },
      });
      console.log(response);
      console.info("contract call success", createNFTs);

      setLoading(false);
      window.location.reload();
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  // Get contract data
  const getUploadedImages = async () => {
    // All Images
    const images = await contract.call("getAllNFTs");

    // Total upload
    const totalUpload = await contract.call("imagesCount");
    // ListingPrice
    const ListingPrice = await contract.call("listingPrice");
    const allImages = images.map((images, i) => ({
      owner: images.creator,
      title: images.title,
      description: images.description,
      email: images.email,
      category: images.category,
      fundraised: images.fundraised,
      image: images.image,
      imageID: images.id.toNumber(),
      createdAt: images.timestamp.toNumber(),
      listedAmount: ethers.utils.formatEther(listingPrice.toString()),
      totalUpload: totalUpload.toNumber(),
    }));
    return allImages;
  };
  // Get Single Image
  const singleImage = async (id) => {
    try {
      const data = await contract.call("getImage", [id]);

      const image = {
        title: data[0],
        description: data[1],
        email: data[2],
        category: data[3],
        fundraised: ethers.utils.formatEther(data[4].toString()),
        creator: data[5],
        imageURL: data[6],
        createdAt: data[7].toNumber(),
      };
      return image;
    } catch (error) {
      console.log(error);
    }
  };

  // Donate
  const donateFund = async ({ amount, id }) => {
    try {
      console.log(amount, id);
      const transaction = await contract.call("donateToImage", [id], {
        value: amount.toString(),
      });
      console.log(transaction);
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  // Get Api data
  const getAllNftsAPI = async () => {
    const response = await axios({
      method: "GET",
      url: "/api/v1/NFTs",
    });
    console.log(response);
  };

  // single NFTS API
  const getSingleNftsAPI = async (id) => {
    const response = await axios({
      method: "GET",
      url: `/api/v1/NFTs${id}`,
    });
    console.log(response);
  };
  return (
    <StateContext.Provider
      value={{
        // CONTRACT
        address,
        contract,
        connect,
        disconnect,
        userBlance,
        setLoading,
        loading,
        // FUNCTION
        uploadImage,
        getUploadedImages,
        donateFund,
        singleImage,
        // API
        getAllNftsAPI,
        getSingleNftsAPI,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
