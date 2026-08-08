import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import TruckPin from './TruckPin';
import { DEFAULT_REGION } from '../utils/constants';

const MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const TruckMap = forwardRef(function TruckMap(
  { trucks = [], selectedTruckId, onSelectTruck, onRegionChangeComplete, initialRegion, showsUserLocation = true, children },
  ref
) {
  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion ?? DEFAULT_REGION}
      customMapStyle={MAP_STYLE}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {trucks
        .filter((t) => typeof t.latitude === 'number' && typeof t.longitude === 'number')
        .map((truck) => (
          <Marker
            key={truck.id}
            coordinate={{ latitude: truck.latitude, longitude: truck.longitude }}
            onPress={() => onSelectTruck?.(truck.id)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <TruckPin
              label={`${truck.volumeM3} m³`}
              selected={truck.id === selectedTruckId}
              available={truck.isAvailable}
            />
          </Marker>
        ))}
      {children}
    </MapView>
  );
});

export default TruckMap;
