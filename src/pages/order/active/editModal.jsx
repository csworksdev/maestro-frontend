import { EditOrder, migrasiOrderById } from "@/axios/masterdata/order";
import { getProdukPool } from "@/axios/masterdata/produk";
import { getTrainerAll } from "@/axios/masterdata/trainer";
import { getKolamByBranch } from "@/axios/referensi/kolam";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icons from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textinput from "@/components/ui/Textinput";
import { toProperCase } from "@/utils";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import AsyncSelect from "react-select/async";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import { DateTime } from "luxon";

const Hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const Jam = [
  "06.00",
  "07.00",
  "08.00",
  "09.00",
  "10.00",
  "11.00",
  "12.00",
  "13.00",
  "14.00",
  "15.00",
  "16.00",
  "17.00",
  "18.00",
];
const params = {
  page: 1,
  page_size: 100,
};

const EditModal = ({ defaultOrder, onClose = null, isEdit = () => {} }) => {
  const [currentOrder, setCurrentOrder] = useState(() => {
    if (Array.isArray(defaultOrder)) {
      return defaultOrder[0] ?? {}; // fallback kalau array kosong
    }
    if (defaultOrder?.modalData) {
      return defaultOrder.modalData;
    }
    return defaultOrder ?? {};
  });

  const [listTrainer, setListTrainer] = useState([]);
  const [listKolam, setListKolam] = useState([]);
  const [listProduct, setListProduct] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedKolam, setSelectedKolam] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedHari, setSelectedHari] = useState(null);
  const [selectedJam, setSelectedJam] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    getTrainerAll(params).then((res) => {
      const formatted = res.data.results.map((t) => ({
        value: t.trainer_id,
        label: toProperCase(t.nickname),
      }));
      setListTrainer(formatted);
    });
    getKolamByBranch(currentOrder.branch).then((res) => {
      const formatted = res.data.results.map((t) => ({
        value: t.pool_id,
        label: toProperCase(t.name),
      }));
      setListKolam(formatted);
    });
    getProdukPool(currentOrder.pool).then((res) => {
      // const formatted = res.data.results.map((t) => ({
      //   value: t.product_id,
      //   label: toProperCase(t.name),
      // }));
      // setListProduct(formatted);
      setListProduct(res.data.results);
    });
  }, []);

  const loadTrainerOptions = (inputValue) =>
    Promise.resolve(
      listTrainer.filter((t) =>
        t.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    );

  const loadKolamOptions = (inputValue) =>
    Promise.resolve(
      listKolam.filter((t) =>
        t.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    );

  const loadProductOptions = (inputValue) =>
    Promise.resolve(
      listProduct.filter((t) =>
        t.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    );

  const updateOrder = async (fieldName, fieldValue) => {
    try {
      const res = await migrasiOrderById(
        currentOrder.order_id,
        fieldName,
        fieldValue
      );

      if (res.status) {
        isEdit(true);
        // onClose();
        Swal.fire({
          title: "Edited!",
          text: "Your order has been updated.",
          icon: "success",
          timer: 1000,
          position: "center",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card title={"Ganti Pelatih"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput
            readOnly
            defaultValue={toProperCase(currentOrder.trainer_name)}
          />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <AsyncSelect
            placeholder="Coach"
            defaultOptions={listTrainer}
            loadOptions={loadTrainerOptions}
            onChange={(e) => setSelectedTrainer(e.value)}
          />
          {selectedTrainer &&
            selectedTrainer.label !==
              toProperCase(currentOrder.trainer_name) && (
              <Button onClick={() => updateOrder("trainer", selectedTrainer)}>
                Ganti
              </Button>
            )}
        </div>
      </Card>

      <Card title={"Ganti Kolam"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput readOnly defaultValue={currentOrder.pool_name} />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <AsyncSelect
            placeholder="Kolam"
            defaultOptions={listKolam}
            loadOptions={loadKolamOptions}
            onChange={(e) => setSelectedKolam(e.value)}
          />

          {selectedKolam &&
            selectedKolam.label !== toProperCase(currentOrder.pool_name) && (
              <Button onClick={() => updateOrder("pool", selectedKolam)}>
                Ganti
              </Button>
            )}
        </div>
      </Card>
      <Card title={"Ganti Tanggal Order"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput readOnly defaultValue={currentOrder.order_date} />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <Flatpickr
            name="order_date"
            options={{
              disableMobile: true,
              allowInput: true,
              altInput: true,
              altFormat: "d F Y",
            }}
            className="form-control py-2"
            onChange={(date) => {
              setSelectedDate(
                DateTime.fromJSDate(date[0]).toFormat("yyyy-MM-dd")
              );
            }}
            readOnly={false}
          />

          {selectedDate && selectedDate !== currentOrder.order_date && (
            <Button onClick={() => updateOrder("date", selectedDate)}>
              Ganti
            </Button>
          )}
        </div>
      </Card>
      <Card title={"Ganti Produk"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput readOnly defaultValue={currentOrder.product_name} />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <AsyncSelect
            placeholder="Produk"
            defaultOptions={listProduct.map((x) => {
              return {
                value: x.product_id,
                label: toProperCase(x.name),
              };
            })}
            loadOptions={loadProductOptions}
            onChange={(e) => setSelectedProduct(e.value)}
          />

          {selectedProduct &&
            selectedProduct !== toProperCase(currentOrder.product) && (
              <Button onClick={() => updateOrder("product", selectedProduct)}>
                Ganti
              </Button>
            )}
        </div>
      </Card>
      <Card title={"Ganti Hari"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput readOnly defaultValue={currentOrder.day} />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <Select
            placeholder="Pilih Hari"
            options={Hari}
            onChange={(e) => setSelectedHari(e.target.value)}
            defaultValue={currentOrder.day}
          />

          {selectedHari && selectedHari !== currentOrder.day && (
            <Button onClick={() => updateOrder("day", selectedHari)}>
              Ganti
            </Button>
          )}
        </div>
      </Card>
      <Card title={"Ganti Jam"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput readOnly defaultValue={currentOrder.time} />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <Select
            placeholder="Pilih Hari"
            options={Jam}
            onChange={(e) => setSelectedJam(e.target.value)}
            defaultValue={currentOrder.time}
          />
          {selectedJam && selectedJam !== currentOrder.time && (
            <Button onClick={() => updateOrder("time", selectedJam)}>
              Ganti
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EditModal;
