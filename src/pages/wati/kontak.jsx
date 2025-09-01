import React, { Fragment, useRef, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import { batchEditKontak, EditKontak, getKontakAll } from "@/axios/wati/kontak";
import Select from "react-select";
import Textinput from "@/components/ui/Textinput";
import { Icon } from "@iconify/react";
import { DateTime } from "luxon";
import { useSelector } from "react-redux";
import { useCallback } from "react";

const furits = [
  { value: "80106972-bbe5-4802-ad4b-0176a618b7b3", label: "Della" },
  { value: "ab4e8249-6ee7-405e-b69e-7d8015b4451d", label: "Lena" },
  { value: "0d6bd594-4c49-49db-93a0-e36c4ea2ba90", label: "Alivia" },
  { value: "f7d9fff1-5455-4cb5-bb92-9bea6a61b447", label: "Chandra" },
];

const styles = {
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const Kontak = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedID, setSelectedID] = useState([]);

  const actions = [
    {
      name: "edit",
      icon: "heroicons:pencil-square",
      onClick: (row) => handleEdit(row.row.original),
    },
    {
      name: "delete",
      icon: "heroicons-outline:trash",
      onClick: (row) => handleDelete(row.row.original),
      className:
        "bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white",
    },
  ];

  const fetchData = async (page, size, query) => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        page_size: size,
        search: query,
      };
      getKontakAll(params)
        .then((res) => {
          setListData(res.data);
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData(pageIndex, pageSize, searchQuery);
  }, [pageIndex, pageSize, searchQuery]);

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on search
  };

  const handleEdit = (e) => {
    navigate("edit", {
      state: {
        isupdate: "true",
        data: e,
      },
    });
  };

  const handleSelectionChange = useCallback((rows) => {
    const ids = rows.map((row) => row.id);
    setSelectedID(ids);
  }, []);

  const COLUMNS = [
    {
      Header: "Nomor WA",
      accessor: "wa_id",
      Cell: (row) => {
        return <span>{row?.cell?.value}</span>;
      },
    },
    {
      Header: "Tanggal Chat",
      accessor: "created",
      Cell: ({ cell }) => {
        const dt = DateTime.fromISO(cell.value); // atau fromFormat kalau datanya bukan ISO
        return <span>{dt.toFormat("dd/MM/yyyy hh:mm:ss")}</span>;
      },
    },
    {
      Header: "Nama",
      accessor: "sender_name",
      Cell: ({ cell, row }) => {
        const [value, setValue] = React.useState(cell.value);
        const [originalValue, setOriginalValue] = React.useState(cell.value);

        React.useEffect(() => {
          setValue(cell.value);
          setOriginalValue(cell.value);
        }, [cell.value]);

        const isEdited = value !== originalValue;

        const handleCancel = () => {
          setValue(originalValue);
        };

        const handleUpdate = async () => {
          try {
            await EditKontak(row.original.id, {
              sender_name: value,
            });
            alert("Berhasil update");
            setOriginalValue(value);
          } catch (err) {
            console.error(err);
            alert("Gagal update");
          }
        };

        return (
          <div className="flex items-center gap-2">
            <Textinput
              id={`sender-name-input-${row.index}`}
              type="text"
              placeholder="Nama"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {isEdited && (
              <>
                <button
                  className="text-xs px-2 py-1 bg-gray-200 rounded"
                  onClick={handleCancel}
                >
                  <Icon icon="heroicons:x-mark" color="red" />
                </button>
                <button
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                  onClick={handleUpdate}
                >
                  <Icon icon="heroicons:check" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
    {
      Header: "Admin",
      accessor: "admin", // pastikan ini UUID string
      Cell: ({ cell, row }) => {
        const [selected, setSelected] = React.useState(
          furits.find((f) => f.value === cell.value)
        );
        const [original, setOriginal] = React.useState(
          furits.find((f) => f.value === cell.value)
        );

        React.useEffect(() => {
          const found = furits.find((f) => f.value === cell.value);
          setSelected(found);
          setOriginal(found);
        }, [cell.value]);

        const isEdited = selected?.value !== original?.value;

        const handleCancel = () => {
          setSelected(original);
        };

        const handleUpdate = async () => {
          try {
            await EditKontak(row.original.id, {
              admin: selected.value,
            });
            alert("Berhasil update");
            setOriginal(selected);
          } catch (err) {
            console.error(err);
            alert("Gagal update");
          }
        };

        return (
          <div className="flex items-center gap-2">
            <Select
              className="react-select"
              classNamePrefix="select"
              value={selected}
              onChange={(option) => setSelected(option)}
              options={furits}
              styles={styles}
              id={`admin-select-${row.index}`}
              placeholder={"Admin"}
            />
            {isEdited && (
              <>
                <button
                  className="text-xs px-2 py-1 bg-gray-200 rounded"
                  onClick={handleCancel}
                >
                  <Icon icon="heroicons:x-mark" color="red" />
                </button>
                <button
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                  onClick={handleUpdate}
                >
                  <Icon icon="heroicons:check" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
    {
      Header: "Tag",
      accessor: "tag",
      Cell: ({ cell, row }) => {
        const [value, setValue] = React.useState(cell.value);
        const [originalValue, setOriginalValue] = React.useState(cell.value);

        // Sinkronkan dengan perubahan props/data baru
        React.useEffect(() => {
          setValue(cell.value);
          setOriginalValue(cell.value);
        }, [cell.value]);

        const isEdited = value !== originalValue;

        const handleCancel = () => {
          setValue(originalValue);
        };

        const handleUpdate = async () => {
          try {
            await EditKontak(row.original.id, {
              tag: value,
            });
            alert("Berhasil update");
          } catch (err) {
            console.error(err);
            alert("Gagal update");
          }
          setOriginalValue(value);
        };

        return (
          <div className="flex items-center gap-2">
            <Textinput
              id={`tag-input-${row.index}`}
              type="text"
              placeholder="Tag"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {isEdited && (
              <>
                <button
                  className="text-xs px-2 py-1 bg-gray-200 rounded"
                  onClick={handleCancel}
                >
                  <Icon icon="heroicons:x-mark" color="red" />
                </button>
                <button
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                  onClick={handleUpdate}
                >
                  <Icon icon="heroicons:check" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Trainer"
        headerslot={
          <Button
            className="btn-primary"
            // disabled={selectedID.length === 0} // ✅ disable kalau belum ada yang dipilih
            onClick={async () => {
              try {
                const payload = { admin: user_id }; // data yg mau diupdate
                const res = await batchEditKontak(selectedID, payload);
                if (res) fetchData(pageIndex, pageSize, searchQuery);
              } catch (err) {
                console.error("Batch update failed:", err);
              }
            }}
          >
            Claim
          </Button>
        }
      >
        <Search searchValue={searchQuery} handleSearch={handleSearch} />
        {isLoading ? (
          <SkeletionTable />
        ) : (
          <>
            <Table
              listData={listData}
              listColumn={COLUMNS}
              searchValue={searchQuery}
              handleSearch={handleSearch}
              isLoading={isLoading}
              isAction={false}
              isCheckbox={true}
              onSelectionChange={handleSelectionChange}
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={Math.ceil(listData.count / pageSize)}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < Math.ceil(listData.count / pageSize) - 1}
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={handlePageSizeChange}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default Kontak;
