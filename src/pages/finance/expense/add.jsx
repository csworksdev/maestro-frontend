import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";

import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { createExpense } from "@/axios/finance/expense";

const statusOptions = ["draft", "submitted", "approved", "rejected", "paid"];
const categoryOptions = [
  "Operational",
  "Marketing",
  "General & Admin",
  "R&D",
  "Travel",
  "Other",
];

const FormValidationSchema = yup
  .object({
    title: yup.string().required("Judul wajib diisi"),
    amount: yup
      .number()
      .typeError("Jumlah harus angka")
      .required("Jumlah wajib diisi"),
  })
  .required();

const AddExpensePage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
    defaultValues: {
      title: "",
      description: "",
      category: "",
      amount: "",
      currency: "IDR",
      transaction_date: "",
      payment_method: "",
      vendor: "",
      cost_center: "",
      project_code: "",
      notes: "",
      attachment_url: "",
      status: "draft",
    },
  });

  const amountValue = watch("amount");
  const currencyValue = watch("currency");

  const amountWithCurrency = useMemo(
    () => formatCurrency(Number(amountValue) || 0, currencyValue),
    [amountValue, currencyValue]
  );

  const onSubmit = async (values) => {
    try {
      const res = await createExpense(values);
      if (res?.data?.status) {
        Swal.fire("Berhasil", "Pengeluaran berhasil ditambahkan", "success");
        navigate(-1);
      }
    } catch (error) {
      Swal.fire("Gagal", "Pengeluaran gagal disimpan", "error");
    }
  };

  return (
    <Card title="Tambah Pengeluaran">
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
            name="vendor"
            label="Vendor/penerima"
            placeholder="Nama vendor"
            register={register}
            error={errors.vendor?.message}
          />
          <Textarea
            name="description"
            label="Deskripsi"
            rows={2}
            register={register}
            error={errors.description?.message}
          />
          <Textarea
            name="notes"
            label="Catatan internal"
            rows={2}
            register={register}
            error={errors.notes?.message}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Icon icon="heroicons-outline:banknotes" />
            <span className="font-semibold">Total:</span>
            <span className="font-semibold text-slate-900">{amountWithCurrency}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-slate-100 text-slate-700"
              onClick={() => navigate(-1)}
              type="button"
            >
              Batal
            </Button>
            <Button
              className="bg-primary-500 text-white"
              type="submit"
              isLoading={isSubmitting}
            >
              Simpan
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

export default AddExpensePage;
