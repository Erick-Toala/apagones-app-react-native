import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert, TouchableOpacity, Modal, Linking  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';


export default function App() {
  const [numero, setNumero] = useState('');
  const [resultados, setResultados] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const abrirModalContacto = () => {
    setModalVisible(true);
  };

  const cerrarModalContacto = () => {
    setModalVisible(false);
  };

  // Cargar el último número y resultados guardados al iniciar la aplicación
  useEffect(() => {
    const cargarDatos = async () => {
      const numeroGuardado = await AsyncStorage.getItem('numero');
      const resultadosGuardados = await AsyncStorage.getItem('resultados');

      if (numeroGuardado) {
        setNumero(numeroGuardado);
      }
      if (resultadosGuardados) {
        setResultados(JSON.parse(resultadosGuardados));
      }
    };
    cargarDatos();
  }, []);

  // Guardar el número y resultados en AsyncStorage después de consultar la API
  const consultarCortes = async () => {
    if (!numero) {
      Alert.alert("Error", "Por favor, ingrese un número válido.");
      return;
    }
    try {
      await AsyncStorage.setItem('numero', numero); // Guardar el número aquí
      const criterio = 'IDENTIFICACION';
      const response = await fetch(`https://api.cnelep.gob.ec/servicios-linea/v1/notificaciones/consultar/${numero}/${criterio}`);
      const data = await response.json();

      if (data.resp === 'OK') {
        setResultados(data.notificaciones || []);
        await AsyncStorage.setItem('resultados', JSON.stringify(data.notificaciones || [])); // Guardar los resultados aquí
      } else {
        Alert.alert("Error", data.mensajeError || "No se encontraron resultados.");
        setResultados([]);
        await AsyncStorage.removeItem('resultados'); // Limpiar resultados si no hay datos
      }
    } catch (error) {
      console.error('Error al consultar la API:', error);
      Alert.alert("Error", "No se pudo conectar con la API.");
    }
  };

  const formatHora = (hora) => {
    const [hours, minutes] = hora.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const mostrarInfo = () => {
    Alert.alert("Información", "Para consultar los cortes en su sector de debe ingresar el número de cédula de  un cliente CNEL.");
  };

  const renderItem = ({ item }) => (
    <View style={styles.resultado}>
      <View style={styles.infoContainer}>
        <Text style={styles.subtitulo}>Cuenta: {item.cuentaContrato}</Text>
        <Text>Dirección: {item.direccion}</Text>
        <Text>Alimentador: {item.alimentador}</Text>
        <Text>CUE: {item.cuen}</Text>
        <Text>Fecha de Registro: {item.fechaRegistro}</Text>

      </View>
      <Text style={styles.titulo}>Cortes Planificados:</Text>
      <FlatList
        data={item.detallePlanificacion}
        keyExtractor={(detalle) => detalle.fechaHoraCorte}
        renderItem={({ item: detalle }) => {
          const corteFechaHora = new Date(detalle.fechaHoraCorte);
          const ahora = new Date();
          const pasado = corteFechaHora < ahora;

          return (
            <View style={[styles.detalle, pasado && styles.detallePasado]}>
              <Text style={[styles.fecha, pasado && styles.fechaPasado]}>{detalle.fechaCorte}</Text>
              <View style={styles.horaContainer}>
                <View style={[styles.horaBox, pasado && styles.horaBoxPasado]}>
                  <Text style={[styles.horaTexto, pasado && styles.horaTextoPasado]}>Desde: {formatHora(detalle.horaDesde)}</Text>
                </View>
                <Text style={styles.flecha}>→</Text>
                <View style={[styles.horaBox, pasado && styles.horaBoxPasado]}>
                  <Text style={[styles.horaTexto, pasado && styles.horaTextoPasado]}>Hasta: {formatHora(detalle.horaHasta)}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consulta de Cortes de Luz</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ingrese Número"
          value={numero}
          onChangeText={(text) => setNumero(text)}
          keyboardType="numeric"
        />
        <TouchableOpacity onPress={mostrarInfo}>
          <Icon name="information-circle-outline" size={24} color="#007bff" style={styles.icon} />
        </TouchableOpacity>
      </View>
      <Button title="Consultar" onPress={consultarCortes} />
      <FlatList
        data={resultados}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Desarrollado por </Text>
        <TouchableOpacity onPress={abrirModalContacto}>
          <Text style={[styles.footerText, styles.footerLink]}>Erick Toala</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}> ©2024</Text>
      </View>
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cerrarModalContacto}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Información de Contacto</Text>
            <Text style={styles.modalText}>Erick Alexander Toala Intriago</Text>
            <Text style={styles.modalText}>Email: toalaerick56@gmail.com</Text>            
            {/* Redes Sociales */}
            <View style={styles.socialIcons}> 
              <TouchableOpacity  onPress={() => Linking.openURL("https://github.com/Erick-Toala")}>
                <Icon name="logo-github" size={34} color="#333" style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL("https://www.instagram.com/toalaerick56")}>
                <Icon name="logo-instagram" size={34} color="#3b5998" style={styles.icon} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={cerrarModalContacto} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', paddingTop: 20 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10
  },
  input: {
    flex: 1,
    padding: 10
  },
  icon: { marginLeft: 5 },
  resultado: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 10, backgroundColor: '#fff', borderRadius: 5 },
  infoContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  titulo: { fontWeight: 'bold', fontSize: 18, paddingTop: 10 },
  subtitulo: { fontWeight: 'bold' },
  detalle: { padding: 10, marginTop: 5, backgroundColor: '#e9f5ff', borderRadius: 5 },
  detallePasado: { backgroundColor: '#cfcfcf' },
  fecha: { fontWeight: 'bold', fontSize: 16, color: '#007bff' },
  fechaPasado: { fontWeight: 'bold', fontSize: 16, color: '#525252' },
  horaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  horaBox: { padding: 10, backgroundColor: '#fff', borderRadius: 5, borderColor: '#007bff', borderWidth: 1 },
  horaBoxPasado: { padding: 10, backgroundColor: '#fff', borderRadius: 5, borderColor: '#525252', borderWidth: 1 },
  flecha: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 10 },
  horaTexto: { fontWeight: 'bold' },
  horaTextoPasado: { fontWeight: 'bold', color: '#525252' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop:5,
  },
  footerText: { fontSize: 16, color: '#555' },
  footerLink: { fontWeight: 'bold', color: '#007bff' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, marginVertical: 5 },
  socialIcons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  icon: { marginHorizontal: 10 },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
});
