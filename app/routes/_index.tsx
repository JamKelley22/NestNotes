import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { generateHouseReview } from "~/generator";
import github from "./github-mark.svg";

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
    <div className="flex flex-col">
      <div className="w-full flex justify-end p-3">
        <a href="https://github.com/JamKelley22/NestNotes">
          <svg
            width="30"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
              fill="white"
            />
          </svg>
        </a>
      </div>

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
    </div>
  );
}
