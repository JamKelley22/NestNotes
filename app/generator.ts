import QRCode, { QRCodeOptions } from "qrcode";
import PDFDocument from "pdfkit";
import { HouseData } from "./routes/_index";
import sharp from "sharp";

async function convertWebpToJpg(webpBuffer: Buffer) {
  try {
    const jpgBuffer = await sharp(webpBuffer)
      .jpeg() // Convert to JPEG format
      .toBuffer();
    return jpgBuffer;
  } catch (error) {
    console.error("Error converting WebP to JPG:", error);
    throw error;
  }
}

const generateQR = async (text: string, extra: QRCodeOptions) => {
  try {
    return QRCode.toDataURL(text, extra);
  } catch (err) {
    console.error(err);
  }
};

const label = (doc: PDFKit.PDFDocument, text: string, x: number, y: number) => {
  const labelFont = "Times-Bold";
  const labelFontSize = 12;
  doc
    .font(labelFont)
    .fontSize(labelFontSize)
    .fillColor("black")
    .text(text, x, y);
};

const text = (doc: PDFKit.PDFDocument, text: string, x: number, y: number) => {
  const labelFont = "Times-Roman";
  const labelFontSize = 10;
  doc
    .font(labelFont)
    .fontSize(labelFontSize)
    .fillColor("black")
    .text(text, x, y, { lineBreak: false });
};

const line = (doc: PDFKit.PDFDocument, x: number, y: number, width: number) => {
  doc.lineWidth(0.5);
  doc
    .lineCap("round")
    .undash()
    .moveTo(x, y)
    .lineTo(x + width, y)
    .strokeColor("black")
    .stroke();
};

const separatorX = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number
) => {
  doc.lineWidth(1.5);
  doc
    .lineCap("round")
    .dash(2, { space: 10 })
    .moveTo(x, y)
    .lineTo(x + width, y)
    .strokeColor("black")
    .stroke();
};

const separatorY = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  height: number
) => {
  doc.lineWidth(1.5);
  doc
    .lineCap("round")
    .dash(2, { space: 10 })
    .moveTo(x, y)
    .lineTo(x, y + height)
    .strokeColor("black")
    .stroke();
};

export const generateHouseReview = async ({
  city,
  address,
  buildYear,
  lotSize,
  numBeds,
  numBaths,
  sqft,
  url,
  imgURL,
  numStr,
  price,
  garageSpaceNum,
  aboveGradeSqft,
}: HouseData) => {
  return new Promise(async function (resolve, reject) {
    const qrDataURL = await generateQR(url || "https://www.google.com", {
      errorCorrectionLevel: "M",
    });

    if (!qrDataURL) throw new Error("Unable to generate QR Code 1");

    const qrAddressURL = await generateQR(
      encodeURI(
        `https://www.google.com/maps/dir/?api=1&destination=${address}`
      ),
      { errorCorrectionLevel: "H" }
    );
    if (!qrAddressURL) throw new Error("Unable to generate QR Code 2");

    const doc = new PDFDocument();

    // doc.pipe(fs.createWriteStream(`${numStr}.pdf`));

    // Array to collect PDF data chunks
    const chunks: Uint8Array[] = [];
    // let _url = "";

    // Collect PDF data chunks as they are generated
    doc.on("data", (chunk: Uint8Array) => {
      chunks.push(chunk);
    });

    // // Handle the end of the document generation
    // doc.on("end", () => {
    //   // Create a Blob from the chunks

    // });

    // doc.pipe(fs.createWriteStream(`${numStr}.pdf`));
    // const stream = doc.pipe(blobStream());

    // stream.on("finish", function () {
    //   // get a blob you can do whatever you like with
    //   const blob = stream.toBlob("application/pdf");

    //   // or get a blob URL for display in the browser
    //   const url = stream.toBlobURL("application/pdf");
    //   iframe.src = url;
    // });

    const imgSize = 200;
    const imgX = 385,
      imgY = 25;
    doc.lineWidth(10);

    if (imgURL) {
      const supportedImgTypes = ["jpg", "png", "webp"];
      const imgType = imgURL.split(".").pop() ?? "";
      if (!supportedImgTypes.includes(imgType)) {
        throw new Error("Unsupported Image Type: " + imgType);
      }
      const response = await fetch(imgURL);
      if (!response.ok)
        throw new Error(`Failed to fetch the image: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (imgType === "webp") {
        const jpgBuffer = await convertWebpToJpg(buffer);
        doc.image(jpgBuffer, imgX, imgY, {
          height: imgSize,
          width: imgSize,
          align: "center",
          valign: "center",
        });
      } else {
        doc.image(buffer, imgX, imgY, {
          height: imgSize,
          width: imgSize,
          align: "center",
          valign: "center",
        });
      }
    }

    const carResponse = await fetch(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Car_with_Driver-Silhouette.svg/916px-Car_with_Driver-Silhouette.svg.png"
    );
    if (!carResponse.ok)
      throw new Error(
        `Failed to fetch the car image: ${carResponse.statusText}`
      );
    const arrayBufferCar = await carResponse.arrayBuffer();
    const bufferCar = Buffer.from(arrayBufferCar);

    const qrCodeSize = 75;
    const qrCodeX = 520,
      qrCodeY = 160;
    doc.lineWidth(28);
    doc
      .lineJoin("round")
      .rect(qrCodeX, qrCodeY, qrCodeSize, qrCodeSize)
      .fillAndStroke("white", "white");
    doc.image(qrDataURL, qrCodeX - 10, qrCodeY - 10, {
      width: qrCodeSize + 10,
      height: qrCodeSize + 10,
    });

    const qrCodeMapSize = 75;
    const qrCodeMapX = 300,
      qrCodeMapY = 40;
    doc.lineWidth(18);
    doc
      .lineJoin("round")
      .rect(qrCodeMapX, qrCodeMapY, qrCodeMapSize, qrCodeMapSize)
      .fillAndStroke("white", "white");
    doc.image(qrAddressURL, qrCodeMapX - 10, qrCodeMapY - 10, {
      width: qrCodeMapSize + 10,
      height: qrCodeMapSize + 10,
    });

    const carSize = 20;
    const carX = 322,
      carY = 60;
    // Add the fetched image to the PDF
    doc.lineWidth(5);
    doc
      .lineJoin("round")
      .rect(carX, carY, carSize, carSize)
      .fillAndStroke("white", "white");
    doc.image(bufferCar, carX, carY, {
      height: carSize,
      width: carSize,
      align: "center",
      valign: "center",
    });

    const priceSizeX = 85,
      priceSizeY = 10;
    const priceX = 380,
      priceY = 220;
    doc.lineWidth(28);
    doc
      .lineJoin("round")
      .rect(priceX, priceY, priceSizeX, priceSizeY)
      .fillAndStroke("white", "white");
    doc
      .font("Helvetica-BoldOblique")
      .fontSize(16)
      .fillColor("black")
      .text(`${price ?? "$???,???"}`, priceX, priceY);

    const numCodeSizeX = 50,
      numCodeSizeY = 10;
    const numCodeX = 550,
      numCodeY = 20;
    doc.lineWidth(10);
    doc
      .lineJoin("round")
      .rect(numCodeX, numCodeY, numCodeSizeX, numCodeSizeY)
      .fillAndStroke("white", "white");
    doc
      .font("Helvetica-BoldOblique")
      .fontSize(18)
      .fillColor("black")
      .text(`# ${numStr}`, numCodeX, numCodeY);

    const colX = [...Array(50)].map((_, i) => (180 / 4) * i + 20);
    const lineY = [...Array(50)].map((_, i) => 30 * (i + 1) + 5);
    const lineHeight = 10;

    let currLine = 0;

    label(doc, "Date: ", colX[0], lineY[currLine]);
    line(doc, colX[0] + 40, lineY[currLine] + lineHeight, 100);

    label(doc, "City: ", colX[3] + 10, lineY[0]);
    line(doc, colX[4], lineY[currLine] + lineHeight, 80);

    text(doc, city ?? "", colX[4], lineY[currLine]);

    currLine++;

    label(doc, "Address: ", colX[0], lineY[currLine]);
    line(doc, colX[0] + 60, lineY[currLine] + lineHeight, 200);

    text(doc, address ?? "", colX[2], lineY[currLine]);

    currLine++;

    line(doc, colX[0] + 60, lineY[currLine] + lineHeight, 200);

    currLine++;

    label(doc, "Star Rating: ", colX[0], lineY[currLine]);
    const starPath = "m25,1 6,17h18l-14,11 5,17-15-10-15,10 5-17-14-11h18z";
    const starScale = 0.3;
    const numStars = 5;
    doc
      .translate(colX[0] + 50, lineY[currLine] - 3)
      .scale(starScale, starScale);
    for (let starIndex = 0; starIndex < numStars; starIndex++) {
      doc.translate(60, 0).path(starPath).fillAndStroke("white", "black");
    }
    doc
      .translate(-(60 * numStars), 0)
      .scale(1 / starScale, 1 / starScale)
      .translate(-colX[0] - 35, -lineY[currLine] + 3);

    label(doc, "Num Rating (1-7): ", colX[4], lineY[currLine]);
    line(doc, colX[5] + 50, lineY[currLine] + lineHeight, 30);

    currLine++;

    separatorX(doc, colX[0], lineY[currLine] + lineHeight / 2, 330);

    currLine++;

    label(doc, "Build Year: ", colX[0], lineY[currLine]);
    line(doc, colX[0] + 65, lineY[currLine] + lineHeight, 50);

    text(doc, buildYear ?? "", colX[1] + 30, lineY[currLine]);

    label(doc, "Sqft: ", colX[3], lineY[currLine]);
    line(doc, colX[3] + 25, lineY[currLine] + lineHeight, 50);

    text(doc, sqft ?? "", colX[4], lineY[currLine]);

    label(doc, "Lot Size: ", colX[5], lineY[currLine]);
    line(doc, colX[5] + 55, lineY[currLine] + lineHeight, 40);

    text(doc, lotSize ?? "", colX[6] + 10, lineY[currLine]);

    currLine++;

    label(doc, "# Beds: ", colX[0], lineY[currLine]);
    line(doc, colX[0] + 40, lineY[currLine] + lineHeight, 50);

    text(doc, Number(numBeds).toString(), colX[1], lineY[currLine]);

    label(doc, "# Baths: ", colX[2] + 5, lineY[currLine]);
    line(doc, colX[2] + 50, lineY[currLine] + lineHeight, 50);

    text(doc, Number(numBaths).toString(), colX[3] + 10, lineY[currLine]);

    label(doc, "# Garage Spaces: ", colX[4] + 15, lineY[currLine]);
    line(doc, colX[4] + 105, lineY[currLine] + lineHeight, 35);

    text(doc, Number(garageSpaceNum).toString(), colX[6] + 20, lineY[currLine]);

    currLine++;

    text(doc, "+         1/2          3/4", colX[2] + 5, lineY[currLine] - 10);

    separatorX(doc, colX[0], lineY[currLine] + lineHeight / 2, 570);

    separatorY(doc, colX[6] + 20, lineY[currLine] + lineHeight, 530);

    currLine++;

    const lineShift = 40;

    label(doc, "Basement: ", colX[0], lineY[currLine]);
    text(
      doc,
      "( Finished / Unfinished / Partial )",
      colX[1] + 12,
      lineY[currLine]
    );
    line(doc, colX[3] + 55, lineY[currLine] + lineHeight, 60);

    currLine++;

    label(doc, "AC: ", colX[0], lineY[currLine]);
    text(doc, "( Y / N )", colX[1] + lineShift, lineY[currLine]);
    label(doc, "Type: ", colX[2] + lineShift, lineY[currLine]);
    line(doc, colX[3] + lineShift - 10, lineY[currLine] + lineHeight, 85);

    currLine++;

    label(doc, "Fireplace: ", colX[0], lineY[currLine]);
    text(doc, "( Y / N )", colX[1] + lineShift, lineY[currLine]);
    label(doc, "Type: ", colX[2] + lineShift, lineY[currLine]);
    line(doc, colX[3] + lineShift - 10, lineY[currLine] + lineHeight, 85);

    currLine++;

    label(doc, "Dishwasher: ", colX[0], lineY[currLine]);
    text(doc, "( Y / N )", colX[1] + lineShift, lineY[currLine]);
    label(doc, "Notes: ", colX[2] + lineShift, lineY[currLine]);
    line(doc, colX[3] + lineShift - 10, lineY[currLine] + lineHeight, 85);

    currLine++;

    label(doc, "Enclosed Porch: ", colX[0], lineY[currLine]);
    text(doc, "( Y / N )", colX[1] + lineShift, lineY[currLine]);
    label(doc, "Type: ", colX[2] + lineShift, lineY[currLine]);
    line(doc, colX[3] + lineShift - 10, lineY[currLine] + lineHeight, 85);

    currLine++;

    separatorX(doc, colX[0], lineY[currLine] + lineHeight / 2, 280);

    currLine++;

    label(doc, "Faulty Outlets: ", colX[0], lineY[currLine]);
    text(doc, "( Y / N )", colX[1] + lineShift, lineY[currLine]);
    label(doc, "# ", colX[2] + lineShift, lineY[currLine]);
    line(doc, colX[3] + 5, lineY[currLine] + lineHeight, 50);

    currLine++;

    label(doc, "Wall Moisture (%): ", colX[0], lineY[currLine]);

    currLine++;

    text(doc, "Basement: ", colX[0], lineY[currLine]);
    line(doc, colX[1] + 5, lineY[currLine] + lineHeight, 30);

    text(doc, "Main: ", colX[2], lineY[currLine]);
    line(doc, colX[2] + 35, lineY[currLine] + lineHeight, 30);

    text(doc, "Bathroom: ", colX[3] + 25, lineY[currLine]);
    line(doc, colX[4] + 30, lineY[currLine] + lineHeight, 30);

    currLine++;

    label(doc, "Temps (F): ", colX[0], lineY[currLine]);

    currLine++;

    text(doc, "Basement: ", colX[0], lineY[currLine]);
    line(doc, colX[1] + 5, lineY[currLine] + lineHeight, 70);

    text(doc, "Main: ", colX[3], lineY[currLine]);
    line(doc, colX[3] + 35, lineY[currLine] + lineHeight, 70);

    currLine = 8;

    label(doc, "Garage: ", colX[7], lineY[currLine]);

    currLine++;

    text(doc, "Project Space: ", colX[7], lineY[currLine]);
    text(doc, "( Y / N )", colX[8] + 15, lineY[currLine]);
    line(doc, colX[9] + 10, lineY[currLine] + lineHeight, 60);

    currLine++;

    label(doc, "Yard: ", colX[7], lineY[currLine]);

    currLine++;

    text(doc, "Trees: ", colX[7], lineY[currLine]);
    line(doc, colX[7] + 30, lineY[currLine] + lineHeight, 30);
    text(doc, "Garden Space: ", colX[8] + 20, lineY[currLine]);
    text(doc, "( Y / N )", colX[9] + 35, lineY[currLine]);
    text(doc, "Shed: ", colX[10] + 30, lineY[currLine]);
    text(doc, "( Y / N )", colX[10] + 60, lineY[currLine]);

    currLine++;

    label(doc, "Neighborhood: ", colX[7], lineY[currLine]);
    currLine++;

    text(doc, "Parks: ", colX[7], lineY[currLine]);
    line(doc, colX[7] + 30, lineY[currLine] + lineHeight, 80);
    text(doc, "Transit: ", colX[9] + 25, lineY[currLine]);
    line(doc, colX[10] + 15, lineY[currLine] + lineHeight, 95);

    currLine++;

    text(doc, "Commute: ", colX[7], lineY[currLine]);
    text(doc, "(A): ", colX[8], lineY[currLine]);
    line(doc, colX[8] + 25, lineY[currLine] + lineHeight, 65);
    text(doc, "(B): ", colX[10] + 10, lineY[currLine]);
    line(doc, colX[10] + 25, lineY[currLine] + lineHeight, 85);

    currLine++;

    separatorX(doc, colX[6] + 30, lineY[currLine] + lineHeight / 2, 280);

    [
      "Windows",
      "Roof",
      "Furnace",
      "Insulation",
      "Electrical",
      "Foundation",
      "Water Heater",
    ].map((section) => {
      currLine++;

      label(doc, `${section}: `, colX[6] + 25, lineY[currLine] - 2);

      text(doc, "Condition: ", colX[8] + 10, lineY[currLine]);
      line(doc, colX[9] + 10, lineY[currLine] + lineHeight, 45);
      text(doc, "Notes: ", colX[10] + 15, lineY[currLine]);
      line(doc, colX[11], lineY[currLine] + lineHeight, 70);
    });

    doc.addPage();

    currLine = 0;

    separatorY(doc, colX[6] + 20, lineY[currLine] - 30, 230);

    label(doc, "Likes: ", colX[2] + 30, lineY[currLine]);
    label(doc, "Dislikes: ", colX[9] + 10, lineY[currLine]);

    for (let likeLineIndex = 0; likeLineIndex < 6; likeLineIndex++) {
      currLine++;

      line(doc, colX[0], lineY[currLine] + lineHeight, 270);
      line(doc, colX[6] + 35, lineY[currLine] + lineHeight, 270);
    }
    currLine++;
    currLine++;

    label(doc, "Work Needed: ", colX[5] + 30, lineY[currLine]);

    for (let workLineIndex = 0; workLineIndex < 8; workLineIndex++) {
      currLine++;
      line(doc, colX[0], lineY[currLine] + lineHeight, 570);
    }

    currLine++;
    currLine++;

    label(doc, "Notes: ", colX[5] + 30, lineY[currLine]);

    for (let workLineIndex = 0; workLineIndex < 6; workLineIndex++) {
      currLine++;
      line(doc, colX[0], lineY[currLine] + lineHeight, 570);
    }

    doc.end();

    doc.on("end", () => {
      doc.flushPages();
      resolve(chunks);
    });
  });
};
