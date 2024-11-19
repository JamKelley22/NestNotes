import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { generateHouseReview } from "~/generator";

export const meta: MetaFunction = () => {
  return [
    { title: "Nest Notes" },
    {
      name: "description",
      content: "Generate PDFs to help with house hunting!",
    },
  ];
};

const HouseData = z.object({
  city: z.string().optional(),
  address: z.string().optional(),
  buildYear: z.string().optional(),
  lotSize: z.string().optional(),
  numBeds: z.string().optional(),
  numBaths: z.string().optional(),
  sqft: z.string().optional(),
  url: z.string().optional(),
  imgURL: z.string().optional(),
  numStr: z.string(),
  price: z.string().optional(),
  garageSpaceNum: z.string().optional(),
  aboveGradeSqft: z.string().optional(),
});

export type HouseData = z.infer<typeof HouseData>;

const toBase64 = (uint8Array: Uint8Array): string => {
  let binary = "";
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

const serializeUint8ArrayArray = (uint8ArrayArray: Uint8Array[]): string[] => {
  return uint8ArrayArray.map(toBase64);
};
const fromBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const len = binary.length;
  const uint8Array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    uint8Array[i] = binary.charCodeAt(i);
  }
  return uint8Array;
};

const deserializeBase64Array = (base64Array: string[]): Uint8Array[] => {
  return base64Array.map(fromBase64);
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const houseData = HouseData.parse(updates);

  const chunks = (await generateHouseReview(houseData)) as Uint8Array[];

  return { url: serializeUint8ArrayArray(chunks) };
};

export default function Index() {
  const data = useActionData<typeof action>();

  const [url, setURL] = useState<string | undefined>();

  useEffect(() => {
    if (data?.url) {
      const chunks = deserializeBase64Array(data?.url ?? []);
      const blob = new Blob(chunks, { type: "application/pdf" });
      setURL(URL.createObjectURL(blob));
    }
  }, [data?.url]);

  return (
    <div className="flex h-screen items-center justify-center flex-col">
      <Form
        onChange={() => {
          setURL(undefined);
        }}
        method="post"
        className="flex flex-col items-start gap-2"
      >
        {[
          {
            name: "buildYear",
            label: "Build Year",
            ariaLabel: "build year",
            type: "text",
          },
          {
            name: "lotSize",
            label: "Lot Size",
            ariaLabel: "lot size",
            type: "text",
          },
          {
            name: "numBeds",
            label: "Beds",
            ariaLabel: "number of beds",
            type: "number",
          },
          {
            name: "numBaths",
            label: "Baths",
            ariaLabel: "number of baths",
            type: "number",
          },
          {
            name: "sqft",
            label: "Area (sqft)",
            ariaLabel: "square footage area",
            type: "text",
          },
          {
            name: "url",
            label: "Link",
            ariaLabel: "link to listing",
            type: "text",
          },
          {
            name: "imgURL",
            label: "Image Link (raw)",
            ariaLabel: "Link to image",
            type: "text",
          },
          {
            name: "numStr",
            label: "Identifier",
            ariaLabel: "Unique Identifier",
            type: "text",
          },
          {
            name: "price",
            label: "Listing Price",
            ariaLabel: "listing price",
            type: "text",
          },
          {
            name: "garageSpaceNum",
            label: "Garage Spaces",
            ariaLabel: "number of garage spaces",
            type: "text",
          },
          {
            name: "aboveGradeSqft",
            label: "Above Grade Area (sqft)",
            ariaLabel: "area above grade (sqft)",
            type: "text",
          },
        ].map(({ name, label, ariaLabel, type }) => (
          <label className="flex gap-2 w-full" key={name}>
            {label}:
            <input
              className="grow"
              name={name}
              aria-label={ariaLabel}
              type={type}
            />
          </label>
        ))}

        <button
          type="submit"
          className="border w-min p-2 border-white rounded-sm"
        >
          Submit
        </button>
      </Form>
      {url && (
        <a href={url} target="_blank">
          Download
        </a>
      )}
    </div>
  );
}
