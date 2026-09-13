import React, { useEffect } from 'react';
import useVendorStore from '../store/useVendorStore';
import CustomSelect from './CustomSelect';

const VendorSelect = ({ value, onChange, onBlur, placeholder = "Pilih / Ketik Vendor", style }) => {
  const { vendors, fetchVendors } = useVendorStore();

  useEffect(() => {
    if (!vendors || vendors.length === 0) {
      fetchVendors();
    }
  }, [fetchVendors, vendors?.length]);

  const uniqueVendors = Array.from(
    new Set((vendors || []).filter(v => v.status === 'Aktif' && (v.review_status === 'CONFIRMED' || !v.review_status)).map(v => v.nama || v.name).filter(Boolean))
  );

  return (
    <CustomSelect
      options={uniqueVendors}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      allowCustom={true}
      searchable={true}
      style={style}
    />
  );
};

export default VendorSelect;
