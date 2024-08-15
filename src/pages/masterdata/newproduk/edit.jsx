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
import Loading from "@/components/Loading";
import Checkbox from "@/components/ui/Checkbox";
import { AddNewProduk, EditNewProduk } from "@/axios/masterdata/newproduk"; // Corrected function imports
import {
  AddNewProdukPool,
  EditNewProdukPool,
  getNewProdukPool,
  DeleteNewProdukPool,
} from "@/axios/masterdata/newprodukpool"; // Corrected function imports

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const isUpdate = isupdate === "true";
  const [poolOption, setPoolOption] = useState([]);
  const [packageOption, setPackageOption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const FormValidationSchema = yup
    .object({
      name: yup.string().required("Nama Paket is required"),
    })
    .required();

  const {
    register,
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
      if (data.selectedPools) setSelected(data.selectedPools); // Ensure previously selected pools are set
    }
  }, [isUpdate, data, setValue]);

  const loadReference = () => {
    const params = {
      page: 1,
      page_size: 50,
    };
    setLoading(true);
    getNewProdukPool(params)
      .then((res) => {
        const fetched = res.data;
        const mappedOption = fetched.map((item) => ({
          value: item.branch_id,
          label: item.name,
          pools: item.pools.map((i) => ({
            value: String(i.pool_id),
            label: i.name,
          })),
        }));
        setPoolOption(mappedOption);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));

    getPaketAll(params)
      .then((res) => {
        const fetched = res.data.results;
        const mappedOption = fetched.map((item) => ({
          value: item.package_id,
          label: item.name,
        }));
        setPackageOption(mappedOption);
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    loadReference();
  }, []);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleAdd = (data, selectedPools) => {
    // Prepare the payload for NewProduct
    const payload = {
      package: data.package, // Assuming data.package contains the package ID
      name: data.name,
      meetings: data.meetings,
      price: data.price,
    };

    // Add the new product
    AddNewProduk(payload)
      .then((res) => {
        if (res.status === 201) {
          const newProductId = res.data.message.product_id;

          // Insert the associated pools into NewProductPool
          const poolPromises = selectedPools.map((poolId) => {
            return AddNewProdukPool({
              product_id: newProductId,
              pool_id: poolId,
            });
          });

          // Wait for all pool associations to complete
          return Promise.all(poolPromises);
        } else {
          throw new Error("Failed to add product");
        }
      })
      .then(() => {
        Swal.fire("Added!", "Your product has been added.", "success").then(
          () => navigate(-1)
        );
      })
      .catch((error) => {
        console.error("Failed to add product:", error);
        Swal.fire("Error!", "There was an error adding the product.", "error");
      });
  };

  const handleUpdate = (data, selectedPools) => {
    // Prepare the payload for updating NewProduct
    const payload = {
      package: data.package, // Assuming data.package contains the package ID
      name: data.name,
      meetings: data.meetings,
      price: data.price,
    };

    // Update the existing product
    EditNewProduk(data.product_id, payload)
      .then((res) => {
        if (res.status === 200) {
          // Delete existing pool associations
          return DeleteNewProdukPool(data.product_id);
        } else {
          throw new Error("Failed to update product");
        }
      })
      .then(() => {
        // Insert the associated pools into NewProductPool
        const poolPromises = selectedPools.map((poolId) => {
          return AddNewProdukPool({
            product_id: data.product_id,
            pool_id: poolId,
          });
        });

        // Wait for all pool associations to complete
        return Promise.all(poolPromises);
      })
      .then(() => {
        Swal.fire("Updated!", "Your product has been updated.", "success").then(
          () => navigate(-1)
        );
      })
      .catch((error) => {
        console.error("Failed to update product:", error);
        Swal.fire(
          "Error!",
          "There was an error updating the product.",
          "error"
        );
      });
  };

  const onSubmit = (newData) => {
    // Extracting the relevant data
    const updatedData = {
      package: newData.package, // Assuming newData.package contains the package ID
      name: newData.name,
      meetings: newData.meetings,
      price: newData.price,
    };

    const selectedPools = selected; // Assuming `selected` contains an array of selected pool IDs

    if (isUpdate) {
      const updatedProductData = {
        ...updatedData,
        product_id: newData.product_id, // Adding the product ID for update
      };
      handleUpdate(newData.product_id, selectedPools);
    } else {
      handleAdd(updatedData, selectedPools);
    }
  };

  const handleCheckboxChange = (poolValue) => {
    setSelected((prevSelected) =>
      prevSelected.includes(poolValue)
        ? prevSelected.filter((item) => item !== poolValue)
        : [...prevSelected, poolValue]
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Card title={`${isUpdate ? "Update" : "Add"} Produk`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
          <Textinput
            name="name"
            label="Nama Produk"
            type="text"
            register={register}
            error={errors.name}
            defaultValue={isUpdate ? data.name : ""}
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
            register={register}
            error={errors.price}
            defaultValue={isUpdate ? data.price : ""}
          />
          <div>
            <label className="form-label" htmlFor="kolam">
              Kolam
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {poolOption.map((option) => (
                <div
                  key={option.value}
                  style={{
                    flex: "1 1 calc(25% - 20px)",
                    boxSizing: "border-box",
                  }}
                >
                  <Card title={option.label}>
                    {option.pools &&
                      option.pools.length > 0 &&
                      option.pools.map((pool) => (
                        <Checkbox
                          key={pool.value}
                          name="kolam"
                          label={pool.label}
                          checked={selected.includes(pool.value)}
                          onChange={() => handleCheckboxChange(pool.value)}
                        />
                      ))}
                  </Card>
                </div>
              ))}
            </div>

            {selected.length > 0 && (
              <div className="text-slate-900 dark:text-white">
                Selected: [{selected.join(", ")}]
              </div>
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
