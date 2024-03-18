import { useState } from "react";
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap";
import axios from "axios";

const pinataApiKey = process.env.REACT_APP_PINATA_API_KEY;
const pinataSecretApiKey = process.env.REACT_APP_PINATA_SECRET;

const Create = ({ marketplace, nft }) => {
    const [image, setImage] = useState("");
    const [price, setPrice] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const uploadToIPFS = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        const file = event.target.files[0];
        formData.append("file", file);
        if (typeof file !== "undefined") {
            try {
                const result = await axios.post(
                    "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data;",
                            pinata_api_key: `${pinataApiKey}`,
                            pinata_secret_api_key: `${pinataSecretApiKey}`,
                        },
                    }
                );
                const ImgHash = `https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`;
                setImage(ImgHash);
            } catch (error) {
                console.log("Error uploading file: ", error);
            }
        }
    };

    const createNFT = async () => {
        if (!image || !price || !name || !description) return;
        try {
            const data = JSON.stringify({ image, price, name, description });
            const result = await axios({
                method: "POST",
                url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                data: data,
                headers: {
                    pinata_api_key: `${pinataApiKey}`,
                    pinata_secret_api_key: `${pinataSecretApiKey}`,
                    "Content-Type": "application/json",
                },
            });
            mintThenList(result);
        } catch (error) {
            console.log("ipfs uri upload error: ", error);
        }
    };

    const mintThenList = async (result) => {
        const uri = `https://gateway.pinata.cloud/ipfs/${result.data.IpfsHash}`;
        await (await nft.mint(uri)).wait();
        const id = await nft.tokenCount();
        await await nft.setApprovalForAll(marketplace.address, true);
        const listingPrice = ethers.utils.parseEther(price.toString());
        await (
            await marketplace.makeItem(nft.address, id, listingPrice)
        ).wait();
    };

    return (
        <div className="container-fluid mt-5">
            <div className="row">
                <main
                    role="main"
                    className="col-lg-12 mx-auto"
                    style={{ maxWidth: "1000px" }}
                >
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control
                                type="file"
                                required
                                name="file"
                                onChange={uploadToIPFS}
                            />
                            <Form.Control
                                type="text"
                                required
                                placeholder="Name"
                                size="lg"
                                onChange={(e) => setName(e.target.value)}
                            />
                            <Form.Control
                                as="textarea"
                                required
                                placeholder="Description"
                                size="lg"
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <Form.Control
                                type="number"
                                required
                                placeholder="Price (ETH)"
                                size="lg"
                                onChange={(e) => setPrice(e.target.value)}
                            />
                            <div className="g-grid px-0">
                                <Button
                                    onClick={createNFT}
                                    variant="primary"
                                    size="lg"
                                >
                                    Create and list NFT!
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Create;
