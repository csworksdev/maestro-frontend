import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";

import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { updateExpense } from "@/axios/finance/expense";

const statusOptions = ["draft", "submitted", "approved", "rejected", "paid"];
const categoryOptions = ["Operational", "Marketing", "General & Admin", "R&D", "Travel", "Other"];

const FormValidationSchema = yup
  .object({
    title: yup.string().required("Judul wajib diisi"),
    amount: yup.number().typeError("Jumlah harus angka").required("Jumlah wajib diisi"),
  })
  .required();

const EditExpensePage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const data = state?.data;

  useEffect(() => {
    if (!data?.expense_id) {
      navigate(-1);
    }
  }, [data, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
      title: data?.title || "",
      description: data?.description || "",
      category: data?.category || "",
      amount: data?.amount || "",
      tax_amount: data?.tax_amount || "",
      currency: data?.currency || "IDR",
      transaction_date: data?.transaction_date || "",
      payment_method: data?.payment_method || "",
      vendor: data?.vendor || "",
      cost_center: data?.cost_center || "",
      project_code: data?.project_code || "",
      notes: data?.notes || "",
      attachment_url: data?.attachment_url || "",
      status: data?.status || "draft",
    },
  });

  const totalWithTax = useMemo(() => {
    const amount = Number(watch("amount") || 0);
    const tax = Number(watch("tax_amount") || 0);
    return amount + tax;
  }, [watch]);

  const onSubmit = async (values) => {
    try {
      const res = await updateExpense(data.expense_id, values);
      if (res?.data?.status) {
        Swal.fire("Berhasil", "Pengeluaran berhasil diperbarui", "success");
        navigate(-1);
      }
    } catch (error) {
      Swal.fire("Gagal", "Pengeluaran gagal diperbarui", "error");
    }
  };

  return (
    <Card title="Update Pengeluaran">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Textinput
            name="title"
            label="Judul*"
            type="text"
            placeholder="Contoh: Sewa kolam"
            register={register}
            error={errors.title?.message}
          />
          <Textinput
            name="transaction_date"
            label="Tanggal transaksi"
            type="date"
            register={register}
            error={errors.transaction_date?.message}
          />
          <Select
            name="category"
            label="Kategori"
            placeholder="Pilih kategori"
            register={register}
            options={categoryOptions.map((c) => ({ value: c, label: c }))}
            error={errors.category?.message}
          />
          <Select
            name="status"
            label="Status"
            placeholder="Pilih status"
            register={register}
            options={statusOptions.map((s) => ({ value: s, label: s }))}
            error={errors.status?.message}
          />
          <Textinput
            name="amount"
            label="Jumlah"
            type="number"
            placeholder="0"
            step="0.01"
            register={register}
            error={errors.amount?.message}
          />
          <Textinput
            name="tax_amount"
            label="Pajak"
            type="number"
            placeholder="0"
            step="0.01"
            register={register}
            error={errors.tax_amount?.message}
          />
          <Textinput
            name="currency"
            label="Mata uang"
            placeholder="IDR"
            register={register}
            error={errors.currency?.message}
          />
          <Textinput
            name="payment_method"
            label="Metode bayar"
            placeholder="Transfer, cash, kartu..."
            register={register}
            error={errors.payment_method?.message}
          />
          <Textinput
            name="vendor"
            label="Vendor/penerima"
            placeholder="Nama vendor"
            register={register}
            error={errors.vendor?.message}
          />
          <Textinput
            name="cost_center"
            label="Cost center"
            placeholder="CC-001"
            register={register}
            error={errors.cost_center?.message}
          />
          <Textinput
            name="project_code"
            label="Kode proyek"
            placeholder="PRJ-01"
            register={register}
            error={errors.project_code?.message}
          />
          <Textinput
            name="attachment_url"
            label="URL bukti"
            placeholder="https://..."
            register={register}
            error={errors.attachment_url?.message}
          />
          <Textarea
            name="description"
            label="Deskripsi"
            rows={2}
            register={register}
            error={errors.description?.message}
          />
          <Textarea name="notes" label="Catatan internal" rows={2} register={register} error={errors.notes?.message} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Icon icon="heroicons-outline:banknotes" />
            <span className="font-semibold">Total (termasuk pajak):</span>
            <span className="font-semibold text-slate-900">{formatCurrency(totalWithTax, watch("currency"))}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-slate-100 text-slate-700" onClick={() => navigate(-1)} type="button">
              Batal
            </Button>
            <Button className="bg-primary-500 text-white" type="submit" isLoading={isSubmitting}>
              Update
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

const formatCurrency = (value, currency = "IDR") => {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
};

export default EditExpensePage;
