package co.com.icvc.intranet_backend.config;

import co.com.icvc.intranet_backend.permisos.CargoPermisosCache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager(CargoPermisosCache.CACHE_NAME);
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }
}