export const setupForm = (data) => {
  const dataIku = data.data || {};
  const additionalData = data.additional_data || {};
  const dynamicField = {};

  for (const key in additionalData) {
    if (additionalData.hasOwnProperty(key)) {
      dynamicField[key] = null
    }
  }
  return {...dataIku, ...dynamicField}
}

export const getLabelField = (data) => {
  let labels = [];
  for (let i = 0; i < data.length; i++) {
    labels[i] = data[i];
  }
  return labels;
}

export const getLabelName = (data) => {
  let field = '';
  if (data.endsWith("_id")) {
    field = data.slice(0, -3);
  } else {
    field = data
  }
  if (field === 'mahasiswa') field = 'NIM mahasiswa';
  if (field.startsWith('file')) field = 'File Pendukung';
  return field.replace(/_/g, ' ');
}
