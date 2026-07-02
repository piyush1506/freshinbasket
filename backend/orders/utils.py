import math

def haversine_distance(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(float(lat2) - float(lat1))
    dlng = math.radians(float(lng2) - float(lng1))
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlng / 2) ** 2
    straight_line = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return straight_line * 1.3 # 1.3 multiplier for road driving distance estimation


def combined_rider_score(distance_km, active_load, max_load, load_balance_factor=5.0):
    if distance_km is None:
        return float('inf')
    max_load = max(max_load, 1)
    load_ratio = active_load / max_load
    return distance_km + load_balance_factor * load_ratio
