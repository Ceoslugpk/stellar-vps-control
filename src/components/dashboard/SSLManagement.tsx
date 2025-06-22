
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Key, Shield, Plus, Settings, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SSLManagement = () => {
  const [certificates, setCertificates] = useState([
    {
      id: 1,
      domain: 'example.com',
      issuer: 'Let\'s Encrypt',
      expires: '2024-12-15',
      status: 'valid',
      autoRenew: true
    },
    {
      id: 2,
      domain: '*.example.com',
      issuer: 'Let\'s Encrypt',
      expires: '2024-12-15',
      status: 'valid',
      autoRenew: true
    }
  ]);

  const [newCert, setNewCert] = useState({
    domain: '',
    method: 'letsencrypt'
  });

  const { toast } = useToast();

  const handleGenerateCertificate = () => {
    if (!newCert.domain) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive"
      });
      return;
    }

    const certificate = {
      id: certificates.length + 1,
      domain: newCert.domain,
      issuer: newCert.method === 'letsencrypt' ? 'Let\'s Encrypt' : 'Self-Signed',
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'valid',
      autoRenew: newCert.method === 'letsencrypt'
    };

    setCertificates([...certificates, certificate]);
    setNewCert({ domain: '', method: 'letsencrypt' });
    toast({
      title: "Success",
      description: `SSL certificate generated for ${newCert.domain}`
    });
  };

  const handleRevokeCertificate = (id: number) => {
    setCertificates(certificates.filter(cert => cert.id !== id));
    toast({
      title: "Certificate Revoked",
      description: "SSL certificate has been revoked and removed"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">SSL/TLS Management</h2>
          <p className="text-gray-600">Manage SSL certificates and HTTPS security</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Generate SSL Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newCert.domain}
                  onChange={(e) => setNewCert({...newCert, domain: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Certificate Method</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="letsencrypt"
                      checked={newCert.method === 'letsencrypt'}
                      onChange={(e) => setNewCert({...newCert, method: e.target.value})}
                    />
                    <span>Let's Encrypt (Free)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="selfsigned"
                      checked={newCert.method === 'selfsigned'}
                      onChange={(e) => setNewCert({...newCert, method: e.target.value})}
                    />
                    <span>Self-Signed</span>
                  </label>
                </div>
              </div>
              <Button onClick={handleGenerateCertificate} className="w-full">
                Generate Certificate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {certificates.map((cert) => (
          <Card key={cert.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Key className="mr-2 h-5 w-5" />
                  {cert.domain}
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant={cert.status === 'valid' ? 'default' : 'destructive'}>
                    {cert.status}
                  </Badge>
                  {cert.autoRenew && (
                    <Badge variant="secondary">Auto-Renew</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Issuer</p>
                  <p className="font-medium">{cert.issuer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires</p>
                  <p className="font-medium">{cert.expires}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Auto-Renewal</p>
                  <p className="font-medium">{cert.autoRenew ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRevokeCertificate(cert.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SSL Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            SSL Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">TLS Settings</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">TLS Version</span>
                  <span className="text-sm font-medium">1.2, 1.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">HSTS</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">OCSP Stapling</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Cipher Suites</h4>
              <div className="space-y-1">
                <p className="text-sm">ECDHE-RSA-AES128-GCM-SHA256</p>
                <p className="text-sm">ECDHE-RSA-AES256-GCM-SHA384</p>
                <p className="text-sm">ECDHE-RSA-CHACHA20-POLY1305</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Custom Certificate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cert">Certificate (.crt)</Label>
            <Textarea
              id="cert"
              placeholder="-----BEGIN CERTIFICATE-----"
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="key">Private Key (.key)</Label>
            <Textarea
              id="key"
              placeholder="-----BEGIN PRIVATE KEY-----"
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="chain">Certificate Chain (optional)</Label>
            <Textarea
              id="chain"
              placeholder="-----BEGIN CERTIFICATE-----"
              className="font-mono text-sm"
            />
          </div>
          <Button>Upload Certificate</Button>
        </CardContent>
      </Card>
    </div>
  );
};
