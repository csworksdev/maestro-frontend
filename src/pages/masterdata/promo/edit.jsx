import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { addPromo, editPromo } from "@/axios/masterdata/promo"; // axios wrapper
import Flatpickr from "react-flatpickr";
import Button from "@/components/ui/Button";
import { DateTime } from "luxon";

const EditPromo = (closeModal = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isupdate = "false",
    data = {},
    isModal = false,
  } = location.state ?? "";
  const isUpdate = isupdate === "true";

  // ✅ Validasi Yup
  const FormValidationSchema = yup
    .object({
      nama_promo: yup.string().required("Nama Promo wajib diisi"),
      start_date: yup.date().required("Tanggal Mulai wajib diisi"),
      end_date: yup
        .date()
        .required("Tanggal Selesai wajib diisi")
        .min(yup.ref("start_date"), "End date tidak boleh sebelum Start date"),
    })
    .required();

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  const handleCancel = () => {
    isModal ? closeModal : navigate(-1);
  };

  const handleAdd = (data) => {
    addPromo(data).then((res) => {
      if (res.status === 201) {
        Swal.fire("Added!", "Promo berhasil ditambahkan.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const handleUpdate = (updatedData) => {
    editPromo(data.id, updatedData).then((res) => {
      if (res.status === 200) {
        Swal.fire("Edited!", "Promo berhasil diupdate.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const onSubmit = (newData) => {
    const payload = {
      ...data,
      nama_promo: newData.nama_promo,
      start_date: DateTime.fromJSDate(newData.start_date).toFormat(
        "yyyy-MM-dd"
      ),
      end_date: DateTime.fromJSDate(newData.end_date).toFormat("yyyy-MM-dd"),
    };

    if (isUpdate) {
      handleUpdate(payload);
    } else {
      handleAdd(payload);
    }
  };

  return (
    <div>
      <Card title={isUpdate ? "Update Promo" : "Tambah Promo"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="nama_promo"
            label="Nama Promo"
            type="text"
            placeholder="Masukan Nama Promo"
            register={register}
            error={errors.nama_promo?.message}
            defaultValue={isUpdate ? data.nama_promo : ""}
          />

          <div>
            <label className="form-label" htmlFor="start_date">
              Tanggal Mulai
            </label>
            <Flatpickr
              defaultValue={isUpdate ? data.start_date : ""}
              name="start_date"
              options={{ dateFormat: "Y-m-d", disableMobile: true }}
              className="form-control py-2"
              onChange={(date) =>
                setValue("start_date", date[0]?.toISOString().slice(0, 10))
              }
            />
            {errors.start_date && (
              <p className="error-message">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label className="form-label" htmlFor="end_date">
              Tanggal Selesai
            </label>
            <Flatpickr
              defaultValue={isUpdate ? data.end_date : ""}
              name="end_date"
              options={{ dateFormat: "Y-m-d", disableMobile: true }}
              className="form-control py-2"
              onChange={(date) =>
                setValue("end_date", date[0]?.toISOString().slice(0, 10))
              }
            />
            {errors.end_date && (
              <p className="error-message">{errors.end_date.message}</p>
            )}
          </div>

          <div className="ltr:text-right rtl:text-left space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-dark text-center">
              {isUpdate ? "Update" : "Add"} Promo
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditPromo;
