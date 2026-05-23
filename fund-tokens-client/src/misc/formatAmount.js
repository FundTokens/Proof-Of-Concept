const formatAmount = (amount) => (amount ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default formatAmount;
