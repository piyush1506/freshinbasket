import math

def haversine_distance(lat1, lng1, lat2, lng2):
    """Returns distance in km between two lat/lng points using the haversine formula."""
    R = 6371
    dlat = math.radians(float(lat2) - float(lat1))
    dlng = math.radians(float(lng2) - float(lng1))
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
