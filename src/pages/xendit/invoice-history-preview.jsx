import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import MaestroBisaLogo from "@/assets/images/logo/logo-mb.png";
import MaestroSwimLogo from "@/assets/images/logo/logo.png";
import {
  downloadXenditInvoiceHistory,
  getXenditInvoiceHistoryPreview,
} from "@/axios/xendit";
import { downloadBlobResponse } from "@/utils/blob-download";
import { DateTime } from "luxon";

const getContentType = (response) =>
  response?.headers?.["content-type"] || response?.data?.type || "";

const firstFilled = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const getDetailPayload = (payload) =>
  payload?.data?.invoice || payload?.invoice || payload?.data || payload;

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return "-";
  }

  return `Rp${numberValue.toLocaleString("en-US")}`;
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  if (typeof value === "string" && value.includes("WIB")) {
    return value;
  }

  const parsed =
    value instanceof Date
      ? DateTime.fromJSDate(value)
      : DateTime.fromISO(String(value), { setZone: true });

  return parsed.isValid
    ? parsed.setZone("Asia/Jakarta").toFormat("yyyy-MM-dd HH:mm:ss 'WIB'")
    : String(value);
};

const getCustomer = (invoice) => invoice?.customer || invoice?.payer || {};

const getItems = (invoice) => {
  const items = firstFilled(
    invoice?.items,
    invoice?.invoice_items,
    invoice?.products,
    invoice?.details
  );

  return Array.isArray(items) ? items : [];
};

const getPaymentMethod = (invoice) => {
  const paymentMethod = firstFilled(
    invoice?.payment_method,
    invoice?.payment_channel,
    invoice?.payment_channel_name,
    invoice?.channel_code
  );

  if (typeof paymentMethod === "string") {
    return paymentMethod;
  }

  if (paymentMethod?.channel_code) {
    const prefix = firstFilled(
      paymentMethod?.type,
      paymentMethod?.channel_category,
      "Transfer Bank"
    );
    return `${prefix} (${paymentMethod.channel_code})`;
  }

  return "-";
};

const getPaymentStatus = (status) => {
  if (!status) {
    return "-";
  }

  const normalized = String(status).toUpperCase();
  if (["PAID", "SETTLED", "LUNAS", "SUCCEEDED"].includes(normalized)) {
    return "Lunas";
  }

  return String(status);
};

const getItemPrice = (item) =>
  firstFilled(item?.price, item?.unit_price, item?.amount, item?.paid_amount, 0);

const getItemQuantity = (item) => firstFilled(item?.quantity, item?.qty, 1);

const getItemTotal = (item) => {
  const explicitTotal = firstFilled(item?.total, item?.total_amount);
  if (explicitTotal !== undefined) {
    return Number(explicitTotal);
  }

  return Number(getItemPrice(item)) * Number(getItemQuantity(item));
};

const getInvoiceTotal = (invoice, items) => {
  const explicitTotal = firstFilled(
    invoice?.paid_amount,
    invoice?.total_amount,
    invoice?.amount,
    invoice?.total
  );

  if (explicitTotal !== undefined) {
    return Number(explicitTotal);
  }

  return items.reduce((total, item) => total + getItemTotal(item), 0);
};

const getPreviewPayload = async (response) => {
  const blob =
    response?.data instanceof Blob
      ? response.data
      : new Blob([response?.data], { type: getContentType(response) });
  const contentType = getContentType(response);

  if (contentType.includes("application/json")) {
    const text = await blob.text();
    const payload = JSON.parse(text);
    const previewData = getDetailPayload(payload);

    if (previewData?.html) {
      const htmlBlob = new Blob([previewData.html], { type: "text/html" });
      return {
        kind: "blob",
        value: window.URL.createObjectURL(htmlBlob),
      };
    }

    const base64Pdf =
      previewData?.pdf_base64 ||
      previewData?.base64_pdf ||
      previewData?.file_base64 ||
      previewData?.base64;

    if (base64Pdf) {
      const base64Text = String(base64Pdf);
      const cleanBase64 = (
        base64Text.includes(",") ? base64Text.split(",").pop() : base64Text
      ).replace(/\s/g, "");
      const byteCharacters = window.atob(cleanBase64);
      const byteNumbers = Array.from(byteCharacters, (char) =>
        char.charCodeAt(0)
      );
      const pdfBlob = new Blob([new Uint8Array(byteNumbers)], {
        type: "application/pdf",
      });

      return {
        kind: "blob",
        value: window.URL.createObjectURL(pdfBlob),
      };
    }

    return {
      kind: "invoice",
      value: previewData,
    };
  }

  if (contentType.includes("text/plain")) {
    return {
      kind: "text",
      value: await blob.text(),
    };
  }

  return {
    kind: "blob",
    value: window.URL.createObjectURL(blob),
  };
};

const InvoiceInfoRow = ({ label, value }) => (
  <div className="grid grid-cols-[250px_16px_1fr] items-start text-[20px] leading-[1.35]">
    <span>{label}</span>
    <span>:</span>
    <strong>{value || "-"}</strong>
  </div>
);

const InvoicePreviewLayout = ({ invoice }) => {
  const customer = getCustomer(invoice);
  const items = getItems(invoice);
  const total = getInvoiceTotal(invoice, items);
  const invoiceNumber = firstFilled(
    invoice?.external_id,
    invoice?.reference_id,
    invoice?.invoice_id,
    invoice?.id
  );
  const customerName = firstFilled(
    customer?.given_names,
    customer?.name,
    customer?.customer_name,
    invoice?.customer_name,
    invoice?.payer_name,
    "-"
  );
  const customerPhone = firstFilled(
    customer?.mobile_number,
    customer?.phone_number,
    customer?.phone,
    invoice?.mobile_number,
    invoice?.phone_number,
    "-"
  );
  const description = firstFilled(
    invoice?.description,
    invoice?.keterangan,
    invoice?.remarks,
    "-"
  );

  return (
    <div className="overflow-x-auto rounded-md bg-slate-100 p-4 dark:bg-slate-900">
      <div className="mx-auto min-h-[794px] w-[1123px] bg-white p-[42px] text-black shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex h-[92px] items-center gap-4">
            <img
              src={MaestroBisaLogo}
              alt="Maestro Bisa"
              className="h-[92px] w-[92px] object-contain"
            />
            <img
              src={MaestroSwimLogo}
              alt="Maestro Swim"
              className="mt-[10px] h-[76px] w-[76px] object-contain"
            />
          </div>
          <div className="pt-4 text-right">
            <div className="text-[28px] font-black tracking-wide">INVOICE</div>
            <div className="mt-2 max-w-[620px] truncate text-[20px] text-[#f37015]">
              {invoiceNumber || "-"}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[330px_1fr] gap-[70px]">
          <div>
            <div className="text-[20px] font-black">DITERBITKAN OLEH</div>
            <div className="mt-2 text-[20px] font-bold">
              {firstFilled(invoice?.issuer_name, invoice?.company_name, "CV Maestro Bisa")}
            </div>
          </div>
          <div>
            <div className="text-[20px] font-black">UNTUK</div>
            <div className="mt-2 space-y-1">
              <InvoiceInfoRow label="Pelanggan" value={customerName} />
              <InvoiceInfoRow
                label="Tanggal Pembelian"
                value={formatDateTime(
                  firstFilled(
                    invoice?.purchase_date,
                    invoice?.created,
                    invoice?.created_at,
                    invoice?.invoice_date
                  )
                )}
              />
              <InvoiceInfoRow label="Nomor Telepon" value={customerPhone} />
            </div>
          </div>
        </div>

        <div className="mt-7 border-y border-slate-700">
          <div className="grid grid-cols-[1fr_140px_220px_240px] px-6 py-2 text-[20px] font-black">
            <div>PRODUK</div>
            <div className="text-center">JUMLAH</div>
            <div className="text-center">HARGA</div>
            <div className="text-right">TOTAL HARGA</div>
          </div>
          <div className="border-t border-slate-700 px-6 py-2">
            {items.length ? (
              items.map((item, index) => {
                const price = Number(getItemPrice(item));
                const quantity = Number(getItemQuantity(item));
                return (
                  <div
                    key={`${item?.name || "item"}-${index}`}
                    className="grid grid-cols-[1fr_140px_220px_240px] text-[20px] leading-[1.4]"
                  >
                    <div>{firstFilled(item?.name, item?.product_name, "-")}</div>
                    <div className="text-center">{quantity || "-"}</div>
                    <div className="text-center">{formatCurrency(price)}</div>
                    <div className="text-right">
                      {formatCurrency(getItemTotal(item))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-[1fr_140px_220px_240px] text-[20px] leading-[1.4]">
                <div>{description}</div>
                <div className="text-center">1</div>
                <div className="text-center">{formatCurrency(total)}</div>
                <div className="text-right">{formatCurrency(total)}</div>
              </div>
            )}

            <div className="mt-2 grid grid-cols-[1fr_220px_240px] text-[20px] leading-[1.7]">
              <div />
              <div className="text-right font-black">SUBTOTAL</div>
              <div className="text-right font-black">{formatCurrency(total)}</div>
              <div />
              <div className="text-right font-black">TOTAL TAGIHAN</div>
              <div className="text-right font-black">{formatCurrency(total)}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-700 py-5">
          <div className="grid grid-cols-[210px_16px_1fr] text-[20px] leading-[1.42]">
            <span>Status Pembayaran</span>
            <span>:</span>
            <strong>{getPaymentStatus(invoice?.status)}</strong>
            <span>Tanggal Pembayaran</span>
            <span>:</span>
            <strong>
              {formatDateTime(firstFilled(invoice?.paid_at, invoice?.pay_at))}
            </strong>
            <span>Metode Pembayaran</span>
            <span>:</span>
            <strong>{getPaymentMethod(invoice)}</strong>
            <span>Tanggal Kedaluarsa</span>
            <span>:</span>
            <strong>
              {formatDateTime(
                firstFilled(
                  invoice?.expiry_date,
                  invoice?.expires_at,
                  invoice?.expiration_date,
                  invoice?.expired_at
                )
              )}
            </strong>
            <span>Keterangan</span>
            <span>:</span>
            <span>{description}</span>
          </div>
        </div>

        <div className="mt-[115px] flex items-end justify-end">
          <div className="max-w-[560px] text-right text-[14px] italic text-slate-600">
            <div>
              Invoice ini sah dan diproses oleh komputer.{" "}
              {formatDateTime(firstFilled(invoice?.paid_at, invoice?.pay_at))}
            </div>
            <div>
              Silahkan hubungi Customer Service kami apabila anda membutuhkan
              bantuan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const XenditInvoiceHistoryPreview = () => {
  const { invoice_id } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const fetchPreview = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await getXenditInvoiceHistoryPreview(invoice_id);
        const payload = await getPreviewPayload(response);

        if (!isMounted) {
          if (payload.kind === "blob") {
            window.URL.revokeObjectURL(payload.value);
          }
          return;
        }

        if (payload.kind === "blob") {
          objectUrl = payload.value;
        }
        setPreview(payload);
      } catch (err) {
        console.error("Error fetching invoice preview", err);
        if (isMounted) {
          setError("Preview invoice tidak dapat dimuat.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [invoice_id]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await downloadXenditInvoiceHistory(invoice_id);
      downloadBlobResponse(response, `invoice-${invoice_id}.pdf`);
    } catch (err) {
      console.error("Error downloading invoice", err);
      setError("Download invoice gagal.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderPreview = () => {
    if (!preview) {
      return (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Tidak ada data preview.
        </div>
      );
    }

    if (preview.kind === "text") {
      return (
        <pre className="min-h-[520px] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {preview.value}
        </pre>
      );
    }

    if (preview.kind === "invoice") {
      return <InvoicePreviewLayout invoice={preview.value} />;
    }

    return (
      <iframe
        title={`Invoice ${invoice_id}`}
        src={preview.value}
        className="h-[calc(100vh-260px)] min-h-[560px] w-full rounded-md border border-slate-200 bg-white dark:border-slate-700"
      />
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <Card
        title="Preview Invoice"
        subtitle={invoice_id}
        headerslot={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              text="Kembali"
              icon="heroicons-outline:arrow-left"
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              onClick={() => navigate("/xendit/invoice-history")}
            />
            <Button
              text="Download"
              icon="heroicons-outline:arrow-down-tray"
              className="bg-primary-500 text-white hover:bg-primary-600"
              onClick={handleDownload}
              isLoading={isDownloading}
            />
          </div>
        }
      >
        {error ? (
          <div className="mb-4 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/40 dark:bg-danger-500/10 dark:text-danger-200">
            {error}
          </div>
        ) : null}

        {isLoading ? <Loading /> : renderPreview()}
      </Card>
    </div>
  );
};

export default XenditInvoiceHistoryPreview;
