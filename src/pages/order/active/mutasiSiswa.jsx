import { migrasiOrderById } from "@/axios/masterdata/order";
import { getTrainerAll } from "@/axios/masterdata/trainer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icons from "@/components/ui/Icon";
import Textinput from "@/components/ui/Textinput";
import { toProperCase } from "@/utils";
import React, { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import Swal from "sweetalert2";

const params = {
  page: 1,
  page_size: 100,
};

const MutasiSiswaModal = ({ defaultOrder, onClose = null, isEdit = false }) => {
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
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const selectMenuStyles = useMemo(
    () => ({
      menuPortal: (base) => ({
        ...base,
        zIndex: 99999,
      }),
    }),
    []
  );

  const menuPortalTarget =
    typeof window !== "undefined" ? window.document.body : null;

  useEffect(() => {
    getTrainerAll(params).then((res) => {
      const formatted = res.data.results.map((t) => ({
        value: t.trainer_id,
        label: toProperCase(t.nickname),
      }));
      setListTrainer(formatted);
    });
  }, []);

  useEffect(() => {
    if (!selectedTrainer && listTrainer.length && currentOrder?.trainer_id) {
      const currentOption = listTrainer.find(
        (trainer) => trainer.value === currentOrder.trainer_id
      );
      if (currentOption) {
        setSelectedTrainer(currentOption);
      }
    }
  }, [listTrainer, currentOrder?.trainer_id, selectedTrainer]);

  const loadTrainerOptions = (inputValue = "") =>
    Promise.resolve(
      listTrainer.filter((t) =>
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
      <Card title={"Mutasi siswa ke pelatih baru"}>
        <div className="grid grid-cols-[auto,1fr,auto,auto,1fr,auto] gap-4 items-center">
          <label className="text-sm text-gray-700">Dari</label>
          <Textinput
            readOnly
            defaultValue={toProperCase(currentOrder.trainer_name)}
          />
          <Icons icon="heroicons-outline:arrows-right-left" width={24} />
          <label className="text-sm text-gray-700">Ke</label>
          <AsyncSelect
            cacheOptions
            placeholder="Coach"
            defaultOptions={listTrainer}
            loadOptions={loadTrainerOptions}
            value={selectedTrainer}
            onChange={(option) => setSelectedTrainer(option)}
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
            styles={selectMenuStyles}
          />
          {selectedTrainer &&
            selectedTrainer.value !== currentOrder.trainer_id && (
              <Button
                onClick={() => updateOrder("mutasi", selectedTrainer.value)}
              >
                Ganti
              </Button>
            )}
        </div>
      </Card>
    </div>
  );
};

export default MutasiSiswaModal;
