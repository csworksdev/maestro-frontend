import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddKolam, EditKolam } from "@/axios/referensi/kolam";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { getCabangAll } from "@/axios/referensi/cabang";
import Loading from "@/components/Loading";

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [branchOption, setBranchOption] = useState([]);
  const [loading, setLoading] = useState(true);

  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Kolam is required"),
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

  const handleCancel = () => {
    navigate(-1);
  };

  useEffect(() => {
    const params = {
      page: 1,
      page_size: 50,
    };
    getCabangAll(params).then((res) => {
      const fetchedBranch = res.data.results;
      const mappedOption = fetchedBranch.map((item) => ({
        value: item.branch_id,
        label: item.name,
      }));
      setBranchOption(mappedOption);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isUpdate && data.branch) {
      setValue("branch", data.branch);
    }
  }, [isUpdate, data, setValue]);

  const handleAdd = (data) => {
    AddKolam(data).then((res) => {
      if (res.status) {
        Swal.fire("Added!", "Your file has been added.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const handleUpdate = (updatedData) => {
    EditKolam(data.pool_id, updatedData).then((res) => {
      if (res.status) {
        Swal.fire("Edited!", "Your file has been edited.", "success").then(() =>
          navigate(-1)
        );
      }
    });
  };

  const onSubmit = (data) => {
    const updatedEvent = {
      ...data,
      name: data.name,
      address: data.address,
      phone: data.phone,
      branch: data.branch,
    };

    if (isUpdate) {
      handleUpdate(updatedEvent);
    } else {
      handleAdd(updatedEvent);
    }
  };

  if (loading) {
    return <Loading />; // Show a loading spinner while data is being fetched
  }

  return (
    <Card title={`${isUpdate ? "Update" : "Add"} Kolam`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="name"
          label="Nama Kolam"
          type="text"
          placeholder="Masukan Nama Kolam"
          register={register}
          error={errors.name?.message}
          defaultValue={isUpdate ? data.name : ""}
        />
        <Textarea
          name="address"
          label="Alamat Kolam"
          type="text"
          placeholder="Alamat Kolam"
          register={register}
          error={errors.address?.message}
          defaultValue={isUpdate ? data.address : ""}
        />
        <Textinput
          name="phone"
          label="No. Telepon"
          type="text"
          placeholder="No. Telepon"
          register={register}
          error={errors.phone?.message}
          defaultValue={isUpdate ? data.phone : ""}
          isMask={true}
          options={{
            blocks: [4, 4, 5],
            delimiter: " ",
            numericOnly: true,
          }}
        />
        <Select
          name="branch"
          label="Cabang"
          placeholder="Pilih Cabang"
          register={register}
          error={errors.branch?.message}
          options={branchOption}
          defaultValue={isUpdate ? data.branch : ""}
        />
        <Textarea
          name="notes"
          label="Catatan"
          type="text"
          placeholder="Catatan"
          register={register}
          error={errors.notes?.message}
          defaultValue={isUpdate ? data.notes : ""}
        />
        <div className="ltr:text-right rtl:text-left space-x-3">
          <button
            type="button"
            className="btn text-center"
            onClick={() => handleCancel()}
          >
            batal
          </button>
          <button className="btn btn-dark text-center" type="submit">
            {isUpdate ? "Update" : "Add"} Kolam
          </button>
        </div>
      </form>
    </Card>
  );
};

export default Edit;
