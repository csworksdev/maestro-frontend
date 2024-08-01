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
  const isUpdate = isupdate == "true";
  const [poolOption, setPoolOption] = useState([]);
  const [packageOption, setPackageOption] = useState([]);
  const [loading, setLoading] = useState(true);

  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Paket is required"),
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
    resolver: yupResolver(FormValidationSchema),
    mode: "all",
  });

  useEffect(() => {
    if (isUpdate) {
      if (data.pool) setValue("pool", data.pool);
      if (data.package) setValue("package", data.package);
    }
  }, [isUpdate, data, setValue]);

  const loadReference = () => {
    try {
      const params = {
        page: 1,
        page_size: 50,
      };
      getKolamAll(params).then((res) => {
        const fetched = res.data.results;
        const mappedOption = fetched.map((item) => ({
          value: item.pool_id,
          label: item.name,
        }));
        setPoolOption(mappedOption);
      });
      getPaketAll(params).then((res) => {
        const fetched = res.data.results;
        const mappedOption = fetched.map((item) => ({
          value: item.package_id,
          label: item.name,
        }));
        setPackageOption(mappedOption);
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReference();
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data) => {
    AddProduk(data).then((res) => {
      if (res.status)
        Swal.fire(
          "Added!",
          "Your file has been Added.",
          "success",
          navigate(-1)
        );
    });
  };

  // edit event
  const handleUpdate = (updatedData) => {
    EditProduk(data.product_id, updatedData).then((res) => {
      if (res.status)
        Swal.fire(
          "Edited!",
          "Your file has been Edited.",
          "success",
          navigate(-1)
        );
    });
  };

  const onSubmit = (newData) => {
    const updatedData = {
      ...data,
      product_id: newData.product_id,
      pool: newData.pool,
      package: newData.package,
      meetings: newData.meetings,
      price: newData.price,
      name: newData.name,
    }; // Create the updated todo object

    if (isUpdate) {
      handleUpdate(updatedData);
    } else {
      handleAdd(updatedData);
    }
  };

  if (loading) {
    return <Loading />; // Show a loading spinner while data is being fetched
  }

  return (
    <div>
      <Card title={isUpdate ? "Update" : "Add" + " Produk"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
          <Textinput
            name="name"
            label="Nama Produk"
            type="text"
            // placeholder="Masukan Nama Produk"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.name : ""}
          />
          <Select
            name="pool"
            label="Kolam"
            placeholder="Pilih kolam"
            register={register}
            error={errors.title}
            options={poolOption}
            defaultValue={isUpdate ? data.pool : ""}
          />
          <Select
            name="package"
            label="Paket"
            placeholder="Pilih paket"
            register={register}
            error={errors.title}
            options={packageOption}
            defaultValue={isUpdate ? data.package : ""}
          />
          <Textinput
            name="meetings"
            label="Pertemuan"
            type="number"
            placeholder="Masukan jumlah pertemuan"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.meetings : ""}
          />
          <Textinput
            name="price"
            label="Harga"
            type="number"
            // placeholder="Masukan minimal s"
            register={register}
            error={errors.title}
            defaultValue={isUpdate ? data.price : ""}
          />
          <div className="ltr:text-right rtl:text-left  space-x-3">
            <button
              type="button"
              className="btn text-center"
              onClick={() => handleCancel()}
            >
              batal
            </button>
            <button className="btn btn-dark  text-center">
              {isUpdate ? "Update" : "Add"} Produk
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Edit;
