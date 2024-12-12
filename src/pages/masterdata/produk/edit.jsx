import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { getPaketAll } from "@/axios/referensi/paket";
import Select from "@/components/ui/Select";
import { getKolamAll } from "@/axios/referensi/kolam";
import { AddProduk, EditProduk } from "@/axios/masterdata/produk";
import Loading from "@/components/Loading";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [poolOption, setPoolOption] = useState([]);
  const [packageOption, setPackageOption] = useState([]);
  const [loading, setLoading] = useState(true);

  const validationSchema = yup
    .object({
      name: yup.string().required("Nama Produk is required"),
      pool: yup.string().required("Kolam is required"),
      package: yup.string().required("Paket is required"),
      meetings: yup
        .number()
        .typeError("Pertemuan must be a number")
        .required("Pertemuan is required"),
      price: yup
        .number()
        .typeError("Harga must be a number")
        .required("Harga is required"),
    })
    .required();

  const {
    register,
    control,
    reset,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  useEffect(() => {
    if (isUpdate) {
      if (data.pool) setValue("pool", data.pool);
      if (data.package) setValue("package", data.package);
    }
  }, [isUpdate, data, setValue]);

  const loadReference = async () => {
    try {
      const params = { page: 1, page_size: 50 };

      const [kolamResponse, paketResponse] = await Promise.all([
        getKolamAll(params),
        getPaketAll(params),
      ]);

      setPoolOption(
        kolamResponse.data.results.map((item) => ({
          value: item.pool_id,
          label: item.name,
        }))
      );
      setPackageOption(
        paketResponse.data.results.map((item) => ({
          value: item.package_id,
          label: item.name,
        }))
      );

      if (isUpdate) {
        setValue("pool", data.pool);
        setValue("package", data.package);
      }
    } catch (error) {
      console.error("Error loading references:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReference();
  }, []);

  const handleCancel = () => navigate(-1);

  const handleAdd = async (newData) => {
    try {
      const res = await AddProduk(newData);
      if (res.status) {
        Swal.fire("Added!", "Your product has been added.", "success").then(
          () => navigate(-1)
        );
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      const res = await EditProduk(data.product_id, updatedData);
      if (res.status) {
        Swal.fire("Updated!", "Your product has been updated.", "success").then(
          () => navigate(-1)
        );
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const onSubmit = (formData) => {
    const preparedData = {
      ...formData,
      product_id: isUpdate ? data.product_id : undefined,
    };

    if (isUpdate) {
      handleUpdate(preparedData);
    } else {
      handleAdd(preparedData);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Card title={`${isUpdate ? "Update" : "Add"} Produk`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="name"
            label="Nama Produk"
            type="text"
            register={register}
            error={errors.name}
            defaultValue={isUpdate ? data.name : ""}
          />
          <Select
            name="pool"
            label="Kolam"
            placeholder="Pilih kolam"
            register={register}
            error={errors.pool}
            options={poolOption}
            defaultValue={isUpdate ? data.pool : ""}
          />
          <Select
            name="package"
            label="Paket"
            placeholder="Pilih paket"
            register={register}
            error={errors.package}
            options={packageOption}
            defaultValue={isUpdate ? data.package : ""}
          />
          <Textinput
            name="meetings"
            label="Pertemuan"
            type="number"
            placeholder="Masukan jumlah pertemuan"
            register={register}
            error={errors.meetings}
            defaultValue={isUpdate ? data.meetings : ""}
          />
          <Textinput
            name="price"
            label="Harga"
            type="number"
            placeholder="Masukan harga"
            register={register}
            error={errors.price}
            defaultValue={isUpdate ? data.price : ""}
          />
          <div className="text-right space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={handleCancel}
            >
              Batal
            </button>
            <button className="btn btn-dark text-center">
              {isUpdate ? "Update" : "Add"} Produk
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
