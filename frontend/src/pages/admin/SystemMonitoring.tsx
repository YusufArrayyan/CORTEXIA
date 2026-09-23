import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  Cloud as ServerIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const SystemMonitoring: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const systemMetrics = [
    {
      icon: <ServerIcon />,
      label: 'Server Uptime',
      value: '99.9%',
      status: 'success',
      description: '30 hari tanpa downtime'
    },
    {
      icon: <DatabaseIcon />,
      label: 'Database Size',
      value: '24.5 GB',
      status: 'success',
      description: 'Kapasitas: 100 GB'
    },
    {
      icon: <PerformanceIcon />,
      label: 'Avg Response Time',
      value: '45ms',
      status: 'success',
      description: 'Target: < 100ms'
    },
    {
      icon: <SecurityIcon />,
      label: 'Security Score',
      value: '95/100',
      status: 'success',
      description: 'Tidak ada ancaman'
    }
  ];

  const serviceStatus = [
    { name: 'Backend API', status: 'healthy', uptime: 99.9, requests: '12.4K/hour', avgResponse: '45ms' },
    { name: 'AI Engine', status: 'healthy', uptime: 99.7, requests: '2.1K/hour', avgResponse: '120ms' },
    { name: 'WebSocket Server', status: 'warning', uptime: 98.5, requests: '5.3K/hour', avgResponse: '250ms' },
    { name: 'Database PostgreSQL', status: 'healthy', uptime: 99.99, requests: '15.2K/hour', avgResponse: '12ms' },
    { name: 'Database MongoDB', status: 'healthy', uptime: 99.8, requests: '8.7K/hour', avgResponse: '18ms' },
    { name: 'Redis Cache', status: 'healthy', uptime: 99.95, requests: '45.3K/hour', avgResponse: '3ms' }
  ];

  const recentLogs = [
    { time: '14:32:15', level: 'info', service: 'Backend API', message: 'Database backup completed successfully' },
    { time: '14:25:43', level: 'warning', service: 'WebSocket', message: 'Connection pool reaching capacity (85%)' },
    { time: '14:18:22', level: 'info', service: 'AI Engine', message: 'Model training completed for user_12345' },
    { time: '14:10:05', level: 'error', service: 'Backend API', message: 'Failed authentication attempt from IP 192.168.1.100' },
    { time: '14:05:33', level: 'info', service: 'Database', message: 'Index optimization completed in 2.3 seconds' },
    { time: '13:58:12', level: 'info', service: 'Redis', message: 'Cache hit rate: 94.2%' }
  ];

  const performanceMetrics = [
    { metric: 'CPU Usage', value: 45, threshold: 80, unit: '%' },
    { metric: 'Memory Usage', value: 62, threshold: 85, unit: '%' },
    { metric: 'Disk I/O', value: 35, threshold: 70, unit: '%' },
    { metric: 'Network Traffic', value: 28, threshold: 80, unit: '%' },
    { metric: 'Active Connections', value: 156, threshold: 500, unit: '' },
    { metric: 'Queue Size', value: 23, threshold: 100, unit: 'jobs' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <SuccessIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Monitoring Sistem
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor performa dan status sistem secara real-time
        </Typography>
      </Box>

      {/* System Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {systemMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: 'success.lighter',
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                      color: 'success.main'
                    }}
                  >
                    {metric.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5">{metric.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Status Layanan" />
            <Tab label="Performa" />
            <Tab label="Log Sistem" />
          </Tabs>

          {/* Service Status Tab */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Layanan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Request/Hour</TableCell>
                    <TableCell>Avg Response</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceStatus.map((service, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {service.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(service.status)}
                          label={service.status === 'healthy' ? 'Sehat' : 'Perhatian'}
                          size="small"
                          color={service.status === 'healthy' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={service.uptime}
                            sx={{ width: 80, height: 6, borderRadius: 3 }}
                            color={service.status === 'healthy' ? 'success' : 'warning'}
                          />
                          <Typography variant="body2">{service.uptime}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{service.requests}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={service.status === 'healthy' ? 'success.main' : 'warning.main'}>
                          {service.avgResponse}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Performance Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {performanceMetrics.map((metric, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {metric.metric}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.value}{metric.unit} / {metric.threshold}{metric.unit}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(metric.value / metric.threshold) * 100}
                      color={metric.value / metric.threshold > 0.8 ? 'warning' : 'success'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              Semua metrik performa dalam batas normal. Sistem beroperasi optimal.
            </Alert>
          </TabPanel>

          {/* System Logs Tab */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Waktu</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Layanan</TableCell>
                    <TableCell>Pesan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentLogs.map((log, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.level.toUpperCase()}
                          size="small"
                          color={getLogLevelColor(log.level)}
                          sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.service}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {log.message}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemMonitoring;
