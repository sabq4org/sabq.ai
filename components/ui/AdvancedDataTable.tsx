import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Stack,
  Typography,
  Box,
  Checkbox,
  Avatar,
  Tooltip,
  TablePagination,
  LinearProgress,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Download,
  TrendingUp,
  TrendingDown,
  Category,
  CheckCircle,
  RadioButtonUnchecked,
  Psychology,
  Article,
} from '@mui/icons-material';

// أنماط الجدول
const styles = {
  tableContainer: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95))',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
    borderBottom: '2px solid #e5e7eb',
  },
  headerCell: {
    fontWeight: 700,
    color: '#374151',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '16px 24px',
  },
  dataRow: {
    '&:hover': {
      background: 'rgba(59, 130, 246, 0.05)',
    },
    transition: 'all 0.2s ease',
    borderBottom: '1px solid #f3f4f6',
  },
  dataCell: {
    padding: '16px 24px',
    color: '#4b5563',
  },
  actionButton: {
    padding: '8px',
    '&:hover': {
      background: 'rgba(59, 130, 246, 0.1)',
    },
  },
  statusChip: {
    fontWeight: 500,
    fontSize: '12px',
    height: '28px',
    borderRadius: '8px',
  },
  categoryChip: {
    fontSize: '12px',
    height: '26px',
    borderRadius: '20px',
    fontWeight: 500,
  },
};

// دالة ألوان التصنيفات
const getCategoryStyle = (category: string) => {
  const styles = {
    'تقنية': {
      background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      color: '#1e40af',
      border: '1px solid #93c5fd',
    },
    'رياضة': {
      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
      color: '#14532d',
      border: '1px solid #86efac',
    },
    'اقتصاد': {
      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      color: '#713f12',
      border: '1px solid #fcd34d',
    },
    'ثقافة': {
      background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
      color: '#581c87',
      border: '1px solid #d8b4fe',
    },
    'صحة': {
      background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
      color: '#831843',
      border: '1px solid #f9a8d4',
    },
  };
  
  return styles[category as keyof typeof styles] || {
    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
    color: '#4b5563',
    border: '1px solid #d1d5db',
  };
};

// دالة ألوان الحالة
const getStatusStyle = (status: string) => {
  const styles = {
    'completed': {
      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
      color: '#14532d',
      border: '1px solid #86efac',
      icon: <CheckCircle sx={{ fontSize: 16 }} />,
    },
    'pending': {
      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      color: '#713f12',
      border: '1px solid #fcd34d',
      icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} />,
    },
    'analyzing': {
      background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      color: '#1e40af',
      border: '1px solid #93c5fd',
      icon: <Psychology sx={{ fontSize: 16, animation: 'spin 2s linear infinite' }} />,
    },
  };
  
  return styles[status as keyof typeof styles] || styles['pending'];
};

// تعريف الأنواع
interface TableData {
  id: number;
  title: string;
  author: string;
  category: string;
  status: string;
  views: number;
  trend: string;
  trendValue: number;
  date: Date;
}

interface AdvancedDataTableProps {
  data: TableData[];
  onRowClick: (row: TableData) => void;
  onEdit: (row: TableData) => void;
  onDelete: (row: TableData) => void;
}

// مكون الجدول المتقدم
const AdvancedDataTable = ({ data, onRowClick, onEdit, onDelete }: AdvancedDataTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentRow, setCurrentRow] = useState<TableData | null>(null);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: TableData) => {
    setAnchorEl(event.currentTarget);
    setCurrentRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentRow(null);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // فلترة البيانات حسب البحث
  const filteredData = data.filter((row) =>
    row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* شريط الأدوات */}
      <Box
        sx={{
          p: 3,
          background: 'white',
          borderRadius: '16px 16px 0 0',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="البحث في المقالات..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: '#e5e7eb',
                  },
                },
              }}
              sx={{ width: 300 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              sx={{
                borderRadius: '12px',
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#3b82f6',
                  background: 'rgba(59, 130, 246, 0.05)',
                },
              }}
            >
              فلتر
            </Button>
          </Stack>
          <Stack direction="row" spacing={2}>
            {selected.length > 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: '#3b82f6',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {selected.length} عنصر محدد
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<Download />}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
                },
              }}
            >
              تصدير
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* الجدول */}
      <TableContainer component={Paper} sx={styles.tableContainer}>
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={styles.tableHeader}>
            <TableRow>
              <TableCell padding="checkbox" sx={styles.headerCell}>
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < data.length}
                  checked={data.length > 0 && selected.length === data.length}
                  onChange={handleSelectAllClick}
                  sx={{
                    color: '#9ca3af',
                    '&.Mui-checked': {
                      color: '#3b82f6',
                    },
                  }}
                />
              </TableCell>
              <TableCell sx={styles.headerCell}>المقال</TableCell>
              <TableCell sx={styles.headerCell}>التصنيف</TableCell>
              <TableCell sx={styles.headerCell}>الحالة</TableCell>
              <TableCell sx={styles.headerCell}>التفاعل</TableCell>
              <TableCell sx={styles.headerCell}>التاريخ</TableCell>
              <TableCell sx={styles.headerCell} align="center">
                الإجراءات
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                const isItemSelected = isSelected(row.id);
                const statusStyle = getStatusStyle(row.status);
                const categoryStyle = getCategoryStyle(row.category);

                return (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={(event) => handleClick(event, row.id)}
                    selected={isItemSelected}
                    sx={styles.dataRow}
                  >
                    <TableCell padding="checkbox" sx={styles.dataCell}>
                      <Checkbox
                        checked={isItemSelected}
                        sx={{
                          color: '#9ca3af',
                          '&.Mui-checked': {
                            color: '#3b82f6',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={styles.dataCell}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            width: 40,
                            height: 40,
                          }}
                        >
                          <Article />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: '#111827',
                              cursor: 'pointer',
                              '&:hover': {
                                color: '#3b82f6',
                              },
                            }}
                            onClick={() => onRowClick(row)}
                          >
                            {row.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.author}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={styles.dataCell}>
                      <Chip
                        icon={<Category sx={{ fontSize: 16 }} />}
                        label={row.category}
                        size="small"
                        sx={{
                          ...styles.categoryChip,
                          ...categoryStyle,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={styles.dataCell}>
                      <Chip
                        icon={statusStyle.icon}
                        label={
                          row.status === 'completed'
                            ? 'مكتمل'
                            : row.status === 'pending'
                            ? 'قيد الانتظار'
                            : 'قيد التحليل'
                        }
                        size="small"
                        sx={{
                          ...styles.statusChip,
                          ...statusStyle,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={styles.dataCell}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Visibility sx={{ fontSize: 16, color: '#6b7280' }} />
                          <Typography variant="body2">{row.views}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {row.trend === 'up' ? (
                            <TrendingUp sx={{ fontSize: 16, color: '#10b981' }} />
                          ) : (
                            <TrendingDown sx={{ fontSize: 16, color: '#ef4444' }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              color: row.trend === 'up' ? '#10b981' : '#ef4444',
                              fontWeight: 500,
                            }}
                          >
                            {row.trendValue}%
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={styles.dataCell}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(row.date).toLocaleDateString('ar-SA')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="عرض">
                          <IconButton
                            sx={styles.actionButton}
                            onClick={() => onRowClick(row)}
                          >
                            <Visibility sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="تعديل">
                          <IconButton
                            sx={styles.actionButton}
                            onClick={() => onEdit(row)}
                          >
                            <Edit sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="المزيد">
                          <IconButton
                            sx={styles.actionButton}
                            onClick={(e) => handleMenuOpen(e, row)}
                          >
                            <MoreVert sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>

        {/* شريط التحميل */}
        {filteredData.length === 0 && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              sx={{
                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                },
              }}
            />
          </Box>
        )}

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="عدد الصفوف:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
          sx={{
            borderTop: '1px solid #e5e7eb',
            '.MuiTablePagination-toolbar': {
              paddingLeft: '24px',
              paddingRight: '24px',
            },
          }}
        />
      </TableContainer>

      {/* قائمة الإجراءات */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (currentRow) {
              onDelete(currentRow);
            }
            handleMenuClose();
          }}
          sx={{
            color: '#ef4444',
            '&:hover': {
              background: 'rgba(239, 68, 68, 0.1)',
            },
          }}
        >
          <Delete sx={{ mr: 2, fontSize: 20 }} />
          حذف
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdvancedDataTable;

// مثال على البيانات
const sampleData = [
  {
    id: 1,
    title: 'تطورات الذكاء الاصطناعي في 2025',
    author: 'أحمد محمد',
    category: 'تقنية',
    status: 'completed',
    views: 1234,
    trend: 'up',
    trendValue: 12.5,
    date: new Date(),
  },
  {
    id: 2,
    title: 'نتائج دوري المحترفين السعودي',
    author: 'خالد العبدالله',
    category: 'رياضة',
    status: 'pending',
    views: 856,
    trend: 'down',
    trendValue: 3.2,
    date: new Date(),
  },
  {
    id: 3,
    title: 'تحليل الأسواق المالية العالمية',
    author: 'سارة أحمد',
    category: 'اقتصاد',
    status: 'analyzing',
    views: 2341,
    trend: 'up',
    trendValue: 8.7,
    date: new Date(),
  },
];

// مثال الاستخدام
const ExampleUsage = () => {
  return (
    <AdvancedDataTable
      data={sampleData}
      onRowClick={(row) => console.log('Row clicked:', row)}
      onEdit={(row) => console.log('Edit:', row)}
      onDelete={(row) => console.log('Delete:', row)}
    />
  );
}; 